import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

export async function parseReddit(): Promise<ParserResult> {
  const agent = { id: "reddit-sborschik", name: "Reddit-Сборщик" };
  const start = Date.now();
  const subredditsStr = process.env.REDDIT_SUBS || "forhire,freelance_forhire";
  const subreddits = subredditsStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (subreddits.length === 0) {
    return { platform: "Reddit", orders: [], count: 0 };
  }

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Reddit",
      status: "info",
      details: `Сабреддиты: ${subreddits.join(", ")}`,
    });

    const orders: ParsedOrder[] = [];

    for (const sub of subreddits) {
      const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.json?q=%5BHiring%5D&restrict_sr=1&sort=new&limit=10`;
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        data?: { children?: Array<{ data?: Record<string, unknown> }> };
      };
      if (!data.data?.children) continue;

      for (const child of data.data.children) {
        const item = child.data;
        if (!item || typeof item.title !== "string") continue;

        const id = String(item.id ?? "");
        if (!id) continue;

        const title = item.title.slice(0, 150);
        const selftext = typeof item.selftext === "string" ? item.selftext : "";
        const description = selftext.slice(0, 1000);
        const created = typeof item.created_utc === "number" ? item.created_utc : 0;
        const postedAt = new Date(created * 1000);
        const permalink = typeof item.permalink === "string" ? item.permalink : "";
        const urlFull = permalink.startsWith("http")
          ? permalink
          : `https://www.reddit.com${permalink}`;

        let budget: number | undefined;
        let currency = "USD";
        const usdMatch =
          title.match(/\$(\d[\d,]*)/) || description.match(/\$(\d[\d,]*)/);
        if (usdMatch?.[1]) {
          budget = parseFloat(usdMatch[1].replace(/,/g, ""));
        }

        orders.push({
          title,
          description,
          platform: "Reddit",
          platformOrderId: id,
          budget,
          currency,
          url: urlFull,
          postedAt,
          rawData: { subreddit: sub },
        });
      }
    }

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование Reddit завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
    });

    return { platform: "Reddit", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { platform: "Reddit", orders: [], count: 0, error: msg };
  }
}
