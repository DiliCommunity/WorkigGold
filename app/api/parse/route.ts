import { NextResponse } from "next/server";
import { runAllParsers } from "@/lib/parsers";
import type { KeywordFilterConfig } from "@/lib/filters/keyword-filter";

/**
 * POST /api/parse — запуск всех парсеров
 * Вызывается вручную или по крону
 */
export async function POST(request: Request) {
  try {
    let keywordFilter: KeywordFilterConfig | undefined;
    try {
      const body = await request.json();
      if (body && typeof body === "object" && "keywordFilter" in body) {
        const kf = (body as { keywordFilter?: KeywordFilterConfig }).keywordFilter;
        if (kf && Array.isArray(kf.include) && Array.isArray(kf.exclude)) {
          keywordFilter = kf;
        }
      }
    } catch {
      // no body
    }

    const result = await runAllParsers({ keywordFilter });
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
