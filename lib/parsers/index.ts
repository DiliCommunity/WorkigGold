import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import { prisma } from "@/lib/prisma";
import { matchesProgrammerStack } from "@/lib/filters/skills";
import { parseFLru } from "./fl-ru";
import { parseKwork } from "./kwork";
import { parseHabr } from "./habr";
import { parseWeblancer } from "./weblancer";
import type { ParsedOrder } from "./types";

export { parseFLru } from "./fl-ru";
export { parseKwork } from "./kwork";
export { parseHabr } from "./habr";
export { parseWeblancer } from "./weblancer";

export interface RunAllResult {
  total: number;
  byPlatform: Record<string, number>;
  errors: string[];
}

async function saveOrder(order: ParsedOrder): Promise<boolean> {
  const key = order.platformOrderId
    ? { platform: order.platform, platformOrderId: order.platformOrderId }
    : { platform: order.platform, title: order.title };

  const existing = await prisma.freelanceOrder.findFirst({
    where: order.platformOrderId
      ? { platform: order.platform, platformOrderId: order.platformOrderId }
      : { platform: order.platform, title: order.title },
  });
  if (existing) return false;

  await prisma.freelanceOrder.create({
    data: {
      title: order.title,
      description: order.description,
      platform: order.platform,
      platformOrderId: order.platformOrderId,
      budget: order.budget,
      currency: order.currency,
      url: order.url,
      rawData: order.rawData as object,
    },
  });
  return true;
}

export async function runAllParsers(): Promise<RunAllResult> {
  const dispatcher = AGENTS.DISPATCHER;
  const start = Date.now();
  const errors: string[] = [];
  const byPlatform: Record<string, number> = {};

  await sendAgentLogToTelegram({
    agentName: dispatcher.name,
    agentId: dispatcher.id,
    action: "Запуск всех парсеров",
    status: "info",
    details: "Фл-Разведчик, Кворк-Сборщик, Хабр-Дозорный, Веблансер-Сканёр",
  });

  // FL.ru, Kwork, Habr, Weblancer — 4 биржи, минимум 3 работают
  const [fl, kwork, habr, weblancer] = await Promise.all([
    parseFLru(),
    parseKwork(),
    parseHabr(),
    parseWeblancer(),
  ]);

  if (fl.error) errors.push(`FL.ru: ${fl.error}`);
  if (kwork.error) errors.push(`Kwork: ${kwork.error}`);
  if (habr.error) errors.push(`Habr: ${habr.error}`);
  if (weblancer.error) errors.push(`Weblancer: ${weblancer.error}`);

  byPlatform[fl.platform] = fl.count;
  byPlatform[kwork.platform] = kwork.count;
  byPlatform[habr.platform] = habr.count;
  byPlatform[weblancer.platform] = weblancer.count;

  let saved = 0;
  let filtered = 0;
  const allOrders = [...fl.orders, ...kwork.orders, ...habr.orders, ...weblancer.orders];
  for (const order of allOrders) {
    if (!matchesProgrammerStack(order.title, order.description)) {
      filtered++;
      continue;
    }
    try {
      const ok = await saveOrder(order);
      if (ok) saved++;
    } catch (e) {
      errors.push(`Save: ${order.title.slice(0, 50)} - ${e}`);
    }
  }

  const duration = Date.now() - start;
  const total = fl.count + kwork.count + habr.count + weblancer.count;

  await sendAgentLogToTelegram({
    agentName: dispatcher.name,
    agentId: dispatcher.id,
    action: "Все парсеры завершены",
    status: errors.length > 0 ? "info" : "success",
    count: total,
    durationMs: duration,
    details: `FL: ${fl.count}, Kwork: ${kwork.count}, Habr: ${habr.count}, Weblancer: ${weblancer.count}. По стеку: ${saved} новых, отфильтровано: ${filtered}`,
    error: errors.length ? errors.slice(0, 3).join("; ") : undefined,
  });

  return { total, byPlatform, errors };
}
