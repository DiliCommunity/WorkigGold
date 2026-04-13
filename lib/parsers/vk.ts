import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

export async function parseVKGroups(): Promise<ParserResult> {
  const agent = { id: "vk-sborschik", name: "ВК-Сборщик" };
  const start = Date.now();
  const token = process.env.VK_SERVICE_TOKEN || "";
  const groupsStr = process.env.VK_GROUPS || "";
  const groups = groupsStr
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  if (!token || groups.length === 0) {
    return { platform: "VK", orders: [], count: 0 };
  }

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования ВКонтакте",
      status: "info",
      details: `Группы: ${groups.join(", ")}`,
    });

    const orders: ParsedOrder[] = [];

    for (const group of groups) {
      const url = `https://api.vk.com/method/wall.get?domain=${encodeURIComponent(group)}&count=15&access_token=${encodeURIComponent(token)}&v=5.131`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = (await res.json()) as {
        response?: { items?: Array<{ id: number; owner_id: number; text?: string; date: number }> };
      };
      if (!data.response?.items) continue;

      for (const item of data.response.items) {
        const text = item.text || "";
        if (!text || text.length < 20) continue;

        const id = `${item.owner_id}_${item.id}`;
        const postedAt = new Date(item.date * 1000);

        const lines = text
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
        const title = lines[0].slice(0, 150) || "Вакансия из VK";
        const description = text.slice(0, 1000);

        let budget: number | undefined;
        let currency = "RUB";
        const rubMatch = text.match(/(\d[\d\s]*)\s*(?:₽|руб\.?|RUB)/i);
        if (rubMatch?.[1]) {
          budget = parseFloat(rubMatch[1].replace(/\s/g, ""));
        } else {
          const usdMatch = text.match(/(\d[\d\s]*)\s*(?:\$|USD)/i);
          if (usdMatch?.[1]) {
            budget = parseFloat(usdMatch[1].replace(/\s/g, ""));
            currency = "USD";
          }
        }

        orders.push({
          title,
          description,
          platform: "VK",
          platformOrderId: id,
          budget,
          currency,
          url: `https://vk.com/wall${id}`,
          postedAt,
          rawData: { group },
        });
      }
    }

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование ВКонтакте завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
    });

    return { platform: "VK", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { platform: "VK", orders: [], count: 0, error: msg };
  }
}
