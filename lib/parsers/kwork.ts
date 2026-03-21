import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import {
  getKworkCredentialsFromEnv,
  kworkFetchProjectsPages,
  kworkSignIn,
  mapKworkProjectToOrder,
} from "@/lib/kwork/mobile-api";
import type { ParserResult, ParsedOrder } from "./types";

const MAX_PROJECT_PAGES = 5;

/**
 * Kwork: лента /projects рендерится в браузере (JS), HTML-парсинг не работает.
 * Сбор заказов — через мобильное API (логин/пароль из env: KWORK_LOGIN, KWORK_PASSWORD).
 */
export async function parseKwork(): Promise<ParserResult> {
  const agent = AGENTS.KWORK_SBORSCHIK;
  const start = Date.now();

  const creds = getKworkCredentialsFromEnv();
  if (!creds) {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Kwork пропущен",
      status: "info",
      details:
        "Нет KWORK_LOGIN / KWORK_PASSWORD в окружении. Добавьте в .env (локально) или в Vercel → Environment Variables.",
    });
    return { platform: "Kwork", orders: [], count: 0 };
  }

  try {
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Запуск сканирования Kwork",
      status: "info",
      details: "Вход через api.kwork.ru (мобильное API)",
    });

    const auth = await kworkSignIn(creds.login, creds.password, creds.phoneLast);
    if ("error" in auth) {
      throw new Error(auth.error);
    }

    const rawList = await kworkFetchProjectsPages(auth.token, MAX_PROJECT_PAGES);
    const orders: ParsedOrder[] = [];

    for (const raw of rawList) {
      const m = mapKworkProjectToOrder(raw);
      if (!m) continue;
      orders.push({
        title: m.title,
        description: m.description,
        platform: "Kwork",
        platformOrderId: m.id,
        budget: m.budget,
        currency: m.currency,
        url: m.url,
        rawData: raw as Record<string, unknown>,
      });
    }

    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Сканирование Kwork завершено",
      status: "success",
      count: orders.length,
      durationMs: duration,
      details: `API: получено ${rawList.length} записей, в заказы: ${orders.length}`,
    });

    return { platform: "Kwork", orders, count: orders.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    await sendAgentLogToTelegram({
      agentName: agent.name,
      agentId: agent.id,
      action: "Ошибка сканирования Kwork",
      status: "error",
      error: msg,
      durationMs: duration,
    });
    return { platform: "Kwork", orders: [], count: 0, error: msg };
  }
}
