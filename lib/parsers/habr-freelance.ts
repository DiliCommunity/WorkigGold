import * as cheerio from "cheerio";
import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const HABR_TASKS_URL = "https://freelance.habr.com/tasks";
const HABR_PROJECTS_URL = "https://freelance.habr.com/projects";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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
  // /tasks/12345 или /projects/12345
  const m = href.match(/\/(?:tasks|projects)\/(\d+)(?:\/|&|\?|$)/i);
  return m?.[1];
}

export async function parseHabrFreelance(): Promise<ParserResult> {
  const agent = AGENTS.HABR_SKANER;
  const start = Date.now();

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Habr Freelance",
      status: "info",
      details: "Отправка запроса к freelance.habr.com",
    });

    const orders: ParsedOrder[] = [];
    const seen = new Set<string>();
    const headers = {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    };

    const urlsToFetch = [
      HABR_TASKS_URL,
      HABR_PROJECTS_URL,
      `${HABR_TASKS_URL}?page=2`,
      `${HABR_PROJECTS_URL}?page=2`,
    ];

    for (const url of urlsToFetch) {
      try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const html = await res.text();
        const $ = cheerio.load(html);

        $("a[href*='/tasks/'], a[href*='/projects/']").each((_, el) => {
          const $a = $(el);
          const href = ($a.attr("href") || "").trim();
          if (!href) return;
          if (href.includes("/tasks?") || href.includes("/projects?")) return;

          const id = extractIdFromHref(href);
          if (!id) return;
          if (seen.has(id)) return;
          seen.add(id);

          const title = ($a.text() || "").trim().replace(/\s+/g, " ").slice(0, 300);
          if (!title || title.length < 5) return;

          const block = $a.closest("article, [class*='task'], [class*='project'], li, div");
          const desc =
            block.find("p, [class*='desc'], [class*='text']").first().text().trim().replace(/\s+/g, " ").slice(0, 500) ||
            title;
          const budgetText = block.text();
          const { value: budget, currency } = parseBudget(budgetText);

          const urlFull = href.startsWith("http") ? href : `https://freelance.habr.com${href}`;

          orders.push({
            title,
            description: desc,
            platform: "Habr Freelance",
            platformOrderId: id,
            budget,
            currency,
            url: urlFull.split("?")[0],
            rawData: {},
          });
        });
      } catch {
        // timeout or fetch error — skip this URL
        continue;
      }
    }

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование Habr Freelance завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
      details: `Найдено ${orders.length} объявлений`,
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
