import * as cheerio from "cheerio";
import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const WEBLANCER_URL = "https://www.weblancer.net/jobs/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

function parseBudget(text: string): { value?: number; currency: string } {
  const rubMatch = text.match(/(\d[\d\s]*)\s*₽|руб|RUB/i);
  if (rubMatch) {
    const val = parseFloat(rubMatch[1].replace(/\s/g, ""));
    return { value: isNaN(val) ? undefined : val, currency: "RUB" };
  }
  const usdMatch = text.match(/(\d[\d\s]*)\s*\$|USD/i);
  if (usdMatch) {
    const val = parseFloat(usdMatch[1].replace(/\s/g, ""));
    return { value: isNaN(val) ? undefined : val, currency: "USD" };
  }
  return { currency: "RUB" };
}

export async function parseWeblancer(): Promise<ParserResult> {
  const agent = AGENTS.WEBLANCER_SKANER;
  const start = Date.now();

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Weblancer",
      status: "info",
      details: "Отправка запроса к weblancer.net/jobs",
    });

    const orders: ParsedOrder[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= 3; page++) {
      const url = page === 1 ? WEBLANCER_URL : `${WEBLANCER_URL}?page=${page}`;

      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      });

      if (!res.ok) {
        if (page === 1) {
          throw new Error(`HTTP ${res.status} on ${url}`);
        }
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      $("a[href*='/jobs/']").each((_, el) => {
        const $a = $(el);
        const href = $a.attr("href") || "";
        const match = href.match(/\/jobs\/(\d+)/);
        if (!match) return;

        const id = match[1];
        if (seen.has(id)) return;
        seen.add(id);

        const title =
          $a.find("[class*='title'], h2, h3").first().text().trim() ||
          $a.text().trim().split("\n")[0]?.trim().slice(0, 300);

        if (!title || title.length < 5) return;

        const block = $a.closest("[class*='job'], [class*='item']");
        const desc =
          block.find("[class*='desc'], [class*='text']").first().text().trim().slice(0, 500) ||
          title;
        const budgetText = block.text();
        const { value: budget, currency } = parseBudget(budgetText);

        const urlFull = href.startsWith("http") ? href : `https://www.weblancer.net${href}`;

        orders.push({
          title: title.slice(0, 300),
          description: desc,
          platform: "Weblancer",
          platformOrderId: id,
          budget,
          currency,
          url: urlFull,
          rawData: {},
        });
      });
    }

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование Weblancer завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
      details: `Найдено ${orders.length} объявлений (до 3 страниц)`,
    });

    return { platform: "Weblancer", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Ошибка сканирования Weblancer",
      status: "error",
      error: msg,
      durationMs: duration,
    });
    return { platform: "Weblancer", orders: [], count: 0, error: msg };
  }
}
