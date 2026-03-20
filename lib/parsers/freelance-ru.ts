import * as cheerio from "cheerio";
import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const FREELANCE_RU_URL = "https://freelance.ru/project/search";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

function parseBudget(text: string): { value?: number; currency: string } {
  const clean = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const rubMatch = clean.match(/(\d[\d\s]*)\s*(?:₽|руб\.?|RUB)/i);
  if (rubMatch?.[1]) {
    const val = parseFloat(rubMatch[1].replace(/\s/g, ""));
    return { value: isNaN(val) ? undefined : val, currency: "RUB" };
  }
  const usdMatch = clean.match(/(\d[\d\s]*)\s*(?:\$|USD)/i);
  if (usdMatch?.[1]) {
    const val = parseFloat(usdMatch[1].replace(/\s/g, ""));
    return { value: isNaN(val) ? undefined : val, currency: "USD" };
  }
  return { currency: "RUB" };
}

function extractIdFromHref(href: string): string | undefined {
  // Пример: /projects/...-1663460.html
  const m = href.match(/-(\d+)\.html(?:\?|#|$)/i);
  return m?.[1];
}

export async function parseFreelanceRu(): Promise<ParserResult> {
  const agent = AGENTS.FREELANCE_RU_SKANER;
  const start = Date.now();

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Freelance.ru",
      status: "info",
      details: "Отправка запроса к freelance.ru/project/search",
    });

    const orders: ParsedOrder[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= 3; page++) {
      const url = page === 1 ? FREELANCE_RU_URL : `${FREELANCE_RU_URL}?page=${page}`;

      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      });

      if (!res.ok) {
        if (page === 1) throw new Error(`HTTP ${res.status} on ${url}`);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Проекты: ссылки вида /projects/<slug>-<id>.html (относительные или абсолютные)
      $("a[href*='/projects/'][href*='.html']").each((_, el) => {
        const $a = $(el);
        const href = ($a.attr("href") || "").trim();
        if (!href) return;
        if (href.includes("/projects/create")) return;
        if (href.includes("/projects/search")) return;

        const id = extractIdFromHref(href);
        if (!id) return;
        if (seen.has(id)) return;
        seen.add(id);

        const title = ($a.text() || "").trim().replace(/\s+/g, " ").slice(0, 300);
        if (!title || title.length < 5) return;

        const card = $a.closest("[class*='project-item'], [rel*='project-item']");
        const desc =
          card
            .find("[class*='description'], [class*='desc'], p")
            .first()
            .text()
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 500) || title;

        const budgetText = card.text();
        const { value: budget, currency } = parseBudget(budgetText);

        const urlFull = href.startsWith("http") ? href : `https://freelance.ru${href}`;

        orders.push({
          title,
          description: desc,
          platform: "Freelance.ru",
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
      action: "Сканирование Freelance.ru завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
      details: `Найдено ${orders.length} объявлений (до 3 страниц)`,
    });

    return { platform: "Freelance.ru", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Ошибка сканирования Freelance.ru",
      status: "error",
      error: msg,
      durationMs: duration,
    });
    return { platform: "Freelance.ru", orders: [], count: 0, error: msg };
  }
}

