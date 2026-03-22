import { NextResponse } from "next/server";
import { getResumeConfig, buildResponseText } from "@/lib/build-response";

/**
 * POST /api/response-text
 * Генерирует текст отклика для копирования в форму на бирже.
 * Body: { orderTitle?, orderDescription?, platform? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderTitle = body.orderTitle ?? "";
    const orderDescription = body.orderDescription ?? "";
    const platform = body.platform ?? "";

    const config = getResumeConfig();
    if (!config) {
      return NextResponse.json(
        { error: "Резюме не настроено. Добавьте RESUME_NAME, RESUME_SKILLS, RESUME_EXPERIENCE, RESUME_EMAIL в .env или Vercel." },
        { status: 400 }
      );
    }

    const text = buildResponseText(
      { title: orderTitle, description: orderDescription, platform },
      config
    );

    return NextResponse.json({ text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
