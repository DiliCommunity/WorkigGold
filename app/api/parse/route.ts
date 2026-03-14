import { NextResponse } from "next/server";
import { runAllParsers } from "@/lib/parsers";

/**
 * POST /api/parse — запуск всех парсеров
 * Вызывается вручную или по крону
 */
export async function POST() {
  try {
    const result = await runAllParsers();
    return NextResponse.json({
      ok: true,
      total: result.total,
      byPlatform: result.byPlatform,
      errors: result.errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
