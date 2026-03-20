import * as cheerio from "cheerio";
import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import type { ParserResult, ParsedOrder } from "./types";

const GURU_URL = "https://www.guru.com/d/jobs/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

function parseBudget(text: string): { value?: number; currency: string } {
  const clean = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const usdMatch = clean.match(/(?:\$|USD)\s*(\d[\d,]*)/i) || clean.match(/(\d[\d,]*)\s*(?:\$|USD)/i);
  if (usdMatch?.[1]) {
    const val = parseFloat(usdMatch[1].replace(/,/g, ""));
    return { value: isNaN(val) ? undefined : val, currency: "USD" };
  }
  return { currency: "USD" };
}

function extractIdFromHref(href: string): string | undefined {
  // Guru: /jobs/some-slug/2116846 или .../2116944&SearchUrl=...
  const m = href.match(/\/jobs\/[^/]+\/(\d+)(?:\/|&|\?|$)/i);
  return m?.[1];
}

export async function parseGuru(): Promise<ParserResult> {
  const agent = AGENTS.GURU_SKANER;
  const start = Date.now();

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Guru",
      status: "info",
      details: "Отправка запроса к guru.com/d/jobs",
    });

    const orders: ParsedOrder[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= 3; page++) {
      const url = page === 1 ? GURU_URL : `${GURU_URL}pg/${page}`;

      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      });
      if (!res.ok) {
        if (page === 1) throw new Error(`HTTP ${res.status} on ${url}`);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      $("a[href*='/jobs/']").each((_, el) => {
        const $a = $(el);
        const href = ($a.attr("href") || "").trim();
        const id = extractIdFromHref(href);
        if (!id) return;
        if (seen.has(id)) return;

        const title = ($a.text() || "").trim().replace(/\s+/g, " ").slice(0, 300);
        if (!title || title.length < 5) return;

        const block = $a.closest("article, li, div");
        const desc =
          block.find("p").first().text().trim().replace(/\s+/g, " ").slice(0, 500) || title;

        const budgetText = block.text();
        const { value: budget, currency } = parseBudget(budgetText);

        const urlFull = (href.startsWith("http") ? href.split("&")[0] : `https://www.guru.com${href.split("&")[0]}`).replace(/\?$/, "");

        seen.add(id);
        orders.push({
          title,
          description: desc,
          platform: "Guru",
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
      action: "Сканирование Guru завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
      details: `Найдено ${orders.length} объявлений (до 3 страниц)`,
    });

    return { platform: "Guru", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Ошибка сканирования Guru",
      status: "error",
      error: msg,
      durationMs: duration,
    });
    return { platform: "Guru", orders: [], count: 0, error: msg };
  }
}

