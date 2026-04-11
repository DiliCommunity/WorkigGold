/**
 * Попытка вытащить ориентиры цен с публичных страниц бирж.
 * Разметка сайтов меняется — результат может быть пустым или приблизительным.
 */
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type ParsedPriceRow = {
  id: string;
  priceRub: number | null;
  period?: string;
  note: string;
  sourceUrl: string;
};

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function stripScripts(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
}

function rubsFromText(text: string): number[] {
  const out: number[] = [];
  const re = /(\d[\d\s]{0,10})\s*(?:₽|руб\.?|RUB)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1].replace(/\s/g, ""), 10);
    if (n >= 10 && n < 2_000_000) out.push(n);
  }
  return out;
}

function usdFromText(text: string): number[] {
  const out: number[] = [];
  const re = /\$\s*(\d[\d,]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    if (n >= 1 && n < 100_000) out.push(n);
  }
  return out;
}

function pickTypicalMonthly(rubs: number[]): number | null {
  const filtered = rubs.filter((n) => n >= 99 && n <= 50_000);
  if (filtered.length === 0) return null;
  filtered.sort((a, b) => a - b);
  return filtered[Math.floor(filtered.length / 2)];
}

function pickTypicalResponse(rubs: number[]): number | null {
  const filtered = rubs.filter((n) => n >= 10 && n <= 500);
  if (filtered.length === 0) return null;
  return Math.min(...filtered);
}

/**
 * USD → RUB (грубо; можно переопределить env ACCOUNTANT_USD_RUB)
 */
function usdToRub(usd: number): number {
  const rate = parseInt(process.env.ACCOUNTANT_USD_RUB || "100", 10);
  const r = Number.isFinite(rate) && rate > 0 ? rate : 100;
  return Math.round(usd * r);
}

export async function parseExchangePriceHints(): Promise<{
  updates: ParsedPriceRow[];
  errors: string[];
}> {
  const updates: ParsedPriceRow[] = [];
  const errors: string[] = [];

  // --- FL.ru ---
  const flHtml = await fetchText("https://www.fl.ru/");
  if (flHtml) {
    const $ = cheerio.load(stripScripts(flHtml));
    const body = $("body").text().replace(/\s+/g, " ");
    const rubs = rubsFromText(body);
    const sub = pickTypicalMonthly(rubs);
    const resp = pickTypicalResponse(rubs);
    updates.push({
      id: "fl-pro",
      priceRub: sub,
      period: "мес",
      note: sub
        ? `Эвристика по тексту главной FL.ru (${sub} ₽). Проверьте в кабинете.`
        : "На главной не найдены явные суммы в ₽ — оставлена база из справочника.",
      sourceUrl: "https://www.fl.ru/",
    });
    updates.push({
      id: "fl-response",
      priceRub: resp,
      note: resp
        ? `Ориентир по числам на fl.ru (${resp} ₽). Реальная цена — в карточке проекта.`
        : "Не удалось выделить цену отклика с главной.",
      sourceUrl: "https://www.fl.ru/projects/",
    });
  } else {
    errors.push("FL.ru: не удалось загрузить страницу");
  }

  // --- Freelance.ru ---
  const frHtml = await fetchText("https://freelance.ru/");
  if (frHtml) {
    const $ = cheerio.load(stripScripts(frHtml));
    const body = $("body").text().replace(/\s+/g, " ");
    const rubs = rubsFromText(body);
    const sub = pickTypicalMonthly(rubs);
    const resp = pickTypicalResponse(rubs);
    updates.push({
      id: "freelance-ru-plus",
      priceRub: sub,
      period: "мес",
      note: sub
        ? `Эвристика по freelance.ru (${sub} ₽). Уточните в разделе Plus/тарифы.`
        : "Не найдены суммы в ₽ на главной.",
      sourceUrl: "https://freelance.ru/",
    });
    updates.push({
      id: "freelance-ru-response",
      priceRub: resp,
      note: resp ? `Ориентир ${resp} ₽ с публичной страницы.` : "Цену отклика уточняйте в интерфейсе.",
      sourceUrl: "https://freelance.ru/project/search",
    });
  } else {
    errors.push("Freelance.ru: не удалось загрузить страницу");
  }

  // --- Guru (USD) ---
  const guruHtml = await fetchText("https://www.guru.com/pricing/");
  if (guruHtml) {
    const $ = cheerio.load(stripScripts(guruHtml));
    const body = $("body").text().replace(/\s+/g, " ");
    const usds = usdFromText(body);
    const smallUsd = usds.filter((u) => u >= 5 && u <= 500);
    const bigUsd = usds.filter((u) => u > 50 && u < 5000);
    const connectUsd = smallUsd.length ? Math.min(...smallUsd) : null;
    const memberUsd = bigUsd.length ? bigUsd.sort((a, b) => a - b)[Math.floor(bigUsd.length / 2)] : null;
    updates.push({
      id: "guru-bids",
      priceRub: connectUsd != null ? usdToRub(connectUsd) : null,
      note:
        connectUsd != null
          ? `~${connectUsd} USD → ~${usdToRub(connectUsd)} ₽ (курс ACCOUNTANT_USD_RUB).`
          : "Не выделены суммы Connects на guru.com/pricing.",
      sourceUrl: "https://www.guru.com/pricing/",
    });
    updates.push({
      id: "guru-membership",
      priceRub: memberUsd != null ? usdToRub(memberUsd) : null,
      period: "год",
      note:
        memberUsd != null
          ? `~${memberUsd} USD/год ориентир → ~${usdToRub(memberUsd)} ₽.`
          : "Проверьте тарифы вручную на Guru.",
      sourceUrl: "https://www.guru.com/pricing/",
    });
  } else {
    errors.push("Guru: не удалось загрузить /pricing/");
  }

  // --- Kwork (текст комиссии / условий) ---
  const kwHtml = await fetchText("https://kwork.ru/terms");
  if (kwHtml) {
    const body = stripScripts(kwHtml).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const pct = body.match(/(\d{1,2}[.,]\d|\d{1,2})\s*%/g);
    const note =
      pct && pct.length
        ? `Найдены упоминания процентов в terms: ${pct.slice(0, 5).join(", ")}. Комиссия не в фикс. ₽.`
        : "Прочитайте раздел комиссий на Kwork вручную.";
    updates.push({
      id: "kwork-commission",
      priceRub: null,
      note,
      sourceUrl: "https://kwork.ru/terms",
    });
    updates.push({
      id: "kwork-response",
      priceRub: null,
      note: "Отклики на Kwork часто с лимитами; детали — в личном кабинете.",
      sourceUrl: "https://kwork.ru/",
    });
  } else {
    errors.push("Kwork: не удалось загрузить terms");
  }

  return { updates, errors };
}
