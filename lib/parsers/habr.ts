import * as cheerio from "cheerio";
import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

// Примечание: Habr Freelance закроется в 2025, URL может возвращать 410
const HABR_URL = "https://freelance.habr.com/tasks";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

function parseBudget(text: string): { value?: number; currency: string } {
  const rubMatch = text.match(/(\d[\d\s]*)\s*₽|руб/i);
  if (rubMatch) {
    const val = parseFloat(rubMatch[1].replace(/\s/g, ""));
    return { value: isNaN(val) ? undefined : val, currency: "RUB" };
  }
  const numMatch = text.match(/(\d[\d\s]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1].replace(/\s/g, ""));
    return { value: isNaN(val) ? undefined : val, currency: "RUB" };
  }
  return { currency: "RUB" };
}

export async function parseHabr(): Promise<ParserResult> {
  const agent = AGENTS.HABR_DOZORNY;
  const start = Date.now();

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Habr Freelance",
      status: "info",
      details: "Отправка запроса к freelance.habr.com",
    });

    const res = await fetch(HABR_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });

    if (!res.ok) {
      if (res.status === 410) {
        await sendAgentLogToTelegram({
          agentName: agent.name,
          agentId: agent.id,
          action: "Habr Freelance закрыт (410 Gone)",
          status: "info",
          details: "Сервис прекратил работу. Можно заменить на Weblancer.",
        });
        return { platform: "Habr Freelance", orders: [], count: 0, error: "410 Gone" };
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const orders: ParsedOrder[] = [];
    const seen = new Set<string>();

    $("a[href*='freelance.habr.com/tasks/']").each((_, el) => {
      const $a = $(el);
      const href = $a.attr("href") || "";
      const match = href.match(/\/tasks\/(\d+)/);
      if (!match) return;

      const id = match[1];
      if (seen.has(id)) return;
      seen.add(id);

      const title =
        $a.find("[class*='title'], [class*='name'], h2").first().text().trim() ||
        $a.text().trim().split("\n")[0]?.trim().slice(0, 300);

      if (!title || title.length < 5) return;

      const block = $a.closest("[class*='task'], [class*='card']");
      const desc =
        block.find("[class*='desc'], [class*='text']").first().text().trim().slice(0, 500) || title;
      const budgetText = block.text();
      const { value: budget, currency } = parseBudget(budgetText);

      const url = href.startsWith("http") ? href : `https://freelance.habr.com${href}`;

      orders.push({
        title: title.slice(0, 300),
        description: desc,
        platform: "Habr Freelance",
        platformOrderId: id,
        budget,
        currency,
        url,
        rawData: {},
      });
    });

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование Habr Freelance завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
    });

    return { platform: "Habr Freelance", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Ошибка сканирования Habr Freelance",
      status: "error",
      error: msg,
      durationMs: duration,
    });
    return { platform: "Habr Freelance", orders: [], count: 0, error: msg };
  }
}
