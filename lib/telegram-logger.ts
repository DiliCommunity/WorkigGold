/**
 * Сервис отправки логов агентов в Telegram
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

export interface LogPayload {
  agentName: string;
  agentId: string;
  action: string;
  status: "success" | "error" | "info";
  count?: number;
  details?: string;
  durationMs?: number;
  error?: string;
}

function formatMessage(payload: LogPayload): string {
  const emoji = { success: "✅", error: "❌", info: "ℹ️" }[payload.status];
  const lines = [
    `${emoji} *${payload.agentName}*`,
    `_${payload.action}_`,
    `Статус: ${payload.status}`,
  ];
  if (payload.count !== undefined) {
    lines.push(`Найдено объявлений: ${payload.count}`);
  }
  if (payload.durationMs !== undefined) {
    lines.push(`Время: ${payload.durationMs} мс`);
  }
  if (payload.details) {
    lines.push(`Детали: ${payload.details}`);
  }
  if (payload.error) {
    lines.push(`Ошибка: ${payload.error}`);
  }
  return lines.join("\n");
}

export async function sendAgentLogToTelegram(payload: LogPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_LOG_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[TelegramLogger] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы");
    return false;
  }

  const text = formatMessage(payload);

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return !!data.ok;
  } catch (e) {
    console.error("[TelegramLogger]", e);
    return false;
  }
}
