import { NextResponse } from "next/server";

/**
 * Краткий совет «ИИ-бухгалтера» по бюджету (OpenAI). Без ключа — заглушка.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const budget = Number(body.budget) || 10000;
    const spent = Number(body.spent) || 0;
    const remaining = Math.max(0, budget - spent);
    const lines: string[] = Array.isArray(body.catalogSummary) ? body.catalogSummary : [];

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      return NextResponse.json({
        advice: `Бюджет: ${budget.toLocaleString("ru-RU")} ₽. Потрачено: ${spent.toLocaleString("ru-RU")} ₽, осталось: ${remaining.toLocaleString("ru-RU")} ₽. Задайте OPENAI_API_KEY для персональных советов.`,
        ai: false,
      });
    }

    const prompt = `Ты бухгалтер-аналитик фрилансера. Бюджет на отклики и подписки: ${budget} RUB. Уже учтено расходов: ${spent} RUB. Остаток: ${remaining} RUB.
Кратко (3-5 предложений, по-русски) дай совет: на что обратить внимание, как не вылететь за бюджет, приоритет подписок vs платных откликов.
Справочник услуг (ориентиры): ${lines.slice(0, 12).join("; ") || "нет"}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        messages: [
          { role: "system", content: "Отвечай кратко, по делу, без воды." },
          { role: "user", content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ advice: `Ошибка ИИ: ${err.slice(0, 200)}`, ai: false }, { status: 200 });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim() || "Нет ответа.";
    return NextResponse.json({ advice: text, ai: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ advice: msg, ai: false }, { status: 200 });
  }
}
