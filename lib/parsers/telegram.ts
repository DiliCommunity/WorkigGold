import * as cheerio from "cheerio";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

export async function parseTelegramChannels(): Promise<ParserResult> {
  const agent = { id: "tg-sborschik", name: "ТГ-Сборщик" };
  const start = Date.now();
  const channelsStr = process.env.TELEGRAM_CHANNELS || "";
  const channels = channelsStr
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (channels.length === 0) {
    return { platform: "Telegram", orders: [], count: 0 };
  }

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Telegram",
      status: "info",
      details: `Каналы: ${channels.join(", ")}`,
    });

    const orders: ParsedOrder[] = [];

    for (const channel of channels) {
      const url = `https://t.me/s/${channel}`;
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      $(".tgme_widget_message").each((_, el) => {
        const $msg = $(el);
        const id = $msg.attr("data-post");
        if (!id) return;

        const text = $msg.find(".tgme_widget_message_text").text().trim();
        if (!text || text.length < 20) return;

        const dateAttr = $msg.find(".tgme_widget_message_date time").attr("datetime");
        const postedAt = dateAttr ? new Date(dateAttr) : new Date();

        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const title = lines[0].slice(0, 150) || "Вакансия из Telegram";
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
          platform: "Telegram",
          platformOrderId: id,
          budget,
          currency,
          url: `https://t.me/${id}`,
          postedAt,
          rawData: { channel },
        });
      });
    }

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование Telegram завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
    });

    return { platform: "Telegram", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { platform: "Telegram", orders: [], count: 0, error: msg };
  }
}
