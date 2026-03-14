/**
 * Отправка сообщений в Telegram
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { parse_mode?: "Markdown" | "HTML"; reply_markup?: object }
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, ...options }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return !!data.ok;
  } catch {
    return false;
  }
}
