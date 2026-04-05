import { NextResponse } from "next/server";
import { parseExchangePriceHints } from "@/lib/accountant/parse-prices";

/**
 * POST — парсинг публичных страниц бирж для ориентиров цен (эвристика).
 */
export async function POST() {
  try {
    const { updates, errors } = await parseExchangePriceHints();
    return NextResponse.json({
      ok: true,
      updates,
      errors,
      parsedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg, updates: [], errors: [msg] }, { status: 500 });
  }
}
