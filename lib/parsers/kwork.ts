import * as cheerio from "cheerio";
import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const KWORK_URL = "https://kwork.ru/projects";
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

export async function parseKwork(): Promise<ParserResult> {
  const agent = AGENTS.KWORK_SBORSCHIK;
  const start = Date.now();

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Kwork",
      status: "info",
      details: "Отправка запроса к kwork.ru/projects",
    });

    const orders: ParsedOrder[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= 3; page++) {
      const url = page === 1 ? KWORK_URL : `${KWORK_URL}?page=${page}`;

      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      });

      if (!res.ok) {
        // если первая страница упала — считаем ошибкой, остальные тихо пропускаем
        if (page === 1) {
          throw new Error(`HTTP ${res.status} on ${url}`);
        }
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Kwork: ссылки на проекты
      $("a[href*='kwork.ru/projects/'], a[href*='/project/']").each((_, el) => {
        const $a = $(el);
        const href = $a.attr("href") || "";
        const match = href.match(/\/(?:projects?|project)\/(\d+)/i);
        if (!match) return;

        const id = match[1];
        if (seen.has(id)) return;
        seen.add(id);

        const title =
          $a.find("[class*='title'], [class*='name'], h2, h3").first().text().trim() ||
          $a.text().trim().split("\n")[0]?.trim().slice(0, 300);

        if (!title || title.length < 5) return;

        const block = $a.closest("[class*='card'], [class*='item'], [class*='project']");
        const desc =
          block.find("[class*='desc'], [class*='text']").first().text().trim().slice(0, 500) ||
          title;
        const budgetText = block.text();
        const { value: budget, currency } = parseBudget(budgetText);

        const urlFull = href.startsWith("http") ? href : `https://kwork.ru${href}`;

        orders.push({
          title: title.slice(0, 300),
          description: desc,
          platform: "Kwork",
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
      action: "Сканирование Kwork завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
      details: `Найдено ${orders.length} объявлений (до 3 страниц)`,
    });

    return { platform: "Kwork", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Ошибка сканирования Kwork",
      status: "error",
      error: msg,
      durationMs: duration,
    });
    return { platform: "Kwork", orders: [], count: 0, error: msg };
  }
}
