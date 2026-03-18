import * as cheerio from "cheerio";
import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const FL_URL = "https://www.fl.ru/projects/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

function parseBudget(text: string): { value?: number; currency: string } {
  const rubMatch = text.match(/(\d[\d\s]*)\s*руб/i);
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

export async function parseFLru(): Promise<ParserResult> {
  const agent = AGENTS.FL_RAZVEDCHIK;
  const start = Date.now();

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования FL.ru",
      status: "info",
      details: "Отправка запроса к fl.ru/projects",
    });

    const res = await fetch(FL_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const orders: ParsedOrder[] = [];

    // FL.ru: b-post, project-item, или div с ссылкой на /projects/ID/
    $("a[href*='/projects/']").each((_, el) => {
      const $a = $(el);
      const href = $a.attr("href") || "";
      const match = href.match(/\/projects\/(\d+)\//);
      if (!match) return;

      const id = match[1];
      const title = $a.find("h2, .b-post__title, .title").first().text().trim()
        || $a.text().trim().split("\n")[0]?.trim()
        || $a.closest(".b-post, .project").find("h2, .b-post__title").first().text().trim();

      if (!title || title.length < 5) return;

      const block = $a.closest(".b-post, .project-item, .project, [class*='post']");
      const desc = block.find(".b-post__txt, .description, [class*='desc']").first().text().trim()
        .slice(0, 500);
      const clientName = block
        .find(".b-post__user a, [class*='user'] a, a[href*='/users/'], a[href*='/employer/']")
        .first()
        .text()
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120) || null;
      const budgetText = block.text();
      const { value: budget, currency } = parseBudget(budgetText);

      const url = href.startsWith("http") ? href : `https://www.fl.ru${href}`;
      if (orders.some((o) => o.platformOrderId === id)) return;

      orders.push({
        title: title.slice(0, 300),
        description: desc || title,
        platform: "FL.ru",
        platformOrderId: id,
        budget,
        currency,
        clientName,
        url,
        rawData: { rawTitle: title, clientName },
      });
    });

    // Дубликаты по platformOrderId
    const seen = new Set<string>();
    const unique = orders.filter((o) => {
      const k = o.platformOrderId || o.url || o.title;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование FL.ru завершено",
      status: "success",
      count: unique.length,
      durationMs: duration,
      details: `Обработано ${$("a[href*='/projects/']").length} элементов`,
    });

    return {
      platform: "FL.ru",
      orders: unique,
      count: unique.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Ошибка сканирования FL.ru",
      status: "error",
      error: msg,
      durationMs: duration,
    });
    return { platform: "FL.ru", orders: [], count: 0, error: msg };
  }
}
