import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram-send";
import { runAllParsers } from "@/lib/parsers";
import { prisma } from "@/lib/prisma";

/**
 * Telegram Webhook — приём сообщений и команд
 * Настроить: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/telegram/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: {
        chat: { id: number; type: string };
        from?: { id: number };
        text?: string;
      };
      callback_query?: {
        message: { chat: { id: number } };
        data?: string;
      };
    };

    const chatId = body.message?.chat?.id ?? body.callback_query?.message?.chat?.id;
    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const text = body.message?.text ?? body.callback_query?.data ?? "";
    const cmd = text.trim().toLowerCase();

    if (cmd === "/start" || cmd === "/help") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";
      const channelUrl = process.env.TELEGRAM_CHANNEL_URL || "https://t.me/your_channel";

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "📱 Попробовать",
              web_app: { url: `${appUrl}/mini-app` },
            },
          ],
          [{ text: "📢 Канал", url: channelUrl }],
        ],
      };

      await sendTelegramMessage(
        String(chatId),
        `*WorkingGold* — умный помощник для фрилансеров

Автоматически собирает заказы с бирж: FL.ru, Freelance.ru, Guru. Агенты парсят объявления и присылают подходящие в этот чат.

*Возможности:*
• Парсинг заказов с 3 бирж
• Фильтрация и отбор по критериям
• Статистика и управление в мини-приложении
• Настраиваемые агенты: роли, задачи, фильтры

*Команды:*
/parse — запустить парсеры
/status — статистика заказов
/help — эта справка`,
        { parse_mode: "Markdown", reply_markup: keyboard }
      );
      return NextResponse.json({ ok: true });
    }

    if (cmd === "/parse") {
      await sendTelegramMessage(
        String(chatId),
        "⏳ Запускаю парсеры... Логи придут сюда.",
        { parse_mode: "Markdown" }
      );
      runAllParsers().catch((e) => {
        console.error("Parse error:", e);
      });
      return NextResponse.json({ ok: true });
    }

    if (cmd === "/status") {
      const [total, byPlatform, recent] = await Promise.all([
        prisma.freelanceOrder.count(),
        prisma.freelanceOrder.groupBy({
          by: ["platform"],
          _count: true,
        }),
        prisma.freelanceOrder.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { title: true, platform: true, status: true },
        }),
      ]);
      const platforms = byPlatform.map((p) => `${p.platform}: ${p._count}`).join("\n");
      const last = recent.map((o) => `• ${o.platform} — ${o.title.slice(0, 40)}...`).join("\n");
      await sendTelegramMessage(
        String(chatId),
        `*Статистика*
Всего заказов: ${total}

По биржам:
${platforms || "—"}

Последние:
${last || "—"}`,
        { parse_mode: "Markdown" }
      );
      return NextResponse.json({ ok: true });
    }

    if (cmd === "/miniapp") {
      const url = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
      await sendTelegramMessage(
        String(chatId),
        `📱 [Открыть мини-приложение](${url}/mini-app)`,
        { parse_mode: "Markdown" }
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
