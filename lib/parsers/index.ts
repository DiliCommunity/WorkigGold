import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import { prisma } from "@/lib/prisma";
import { matchesProgrammerStack } from "@/lib/filters/skills";
import { parseFLru } from "./fl-ru";
import { parseFreelanceRu } from "./freelance-ru";
import { parseWeblancer } from "./weblancer";
import { parseGuru } from "./guru";
import type { ParsedOrder } from "./types";

export { parseFLru } from "./fl-ru";
export { parseFreelanceRu } from "./freelance-ru";
export { parseWeblancer } from "./weblancer";
export { parseGuru } from "./guru";

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
    details: "Фл-Разведчик, Фрилансру-Сканёр, Веблансер-Сканёр, Гуру-Сканёр",
  });

  // FL.ru, Freelance.ru, Weblancer, Guru — 4 биржи, минимум 3 работают
  const [fl, freelanceRu, weblancer, guru] = await Promise.all([
    parseFLru(),
    parseFreelanceRu(),
    parseWeblancer(),
    parseGuru(),
  ]);

  if (fl.error) errors.push(`FL.ru: ${fl.error}`);
  if (freelanceRu.error) errors.push(`Freelance.ru: ${freelanceRu.error}`);
  if (weblancer.error) errors.push(`Weblancer: ${weblancer.error}`);
  if (guru.error) errors.push(`Guru: ${guru.error}`);

  byPlatform[fl.platform] = fl.count;
  byPlatform[freelanceRu.platform] = freelanceRu.count;
  byPlatform[weblancer.platform] = weblancer.count;
  byPlatform[guru.platform] = guru.count;

  let saved = 0;
  let filtered = 0;
  const allOrders = [...fl.orders, ...freelanceRu.orders, ...weblancer.orders, ...guru.orders];
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
  const total = fl.count + freelanceRu.count + weblancer.count + guru.count;

  await sendAgentLogToTelegram({
    agentName: dispatcher.name,
    agentId: dispatcher.id,
    action: "Все парсеры завершены",
    status: errors.length > 0 ? "info" : "success",
    count: total,
    durationMs: duration,
    details: `FL: ${fl.count}, Freelance.ru: ${freelanceRu.count}, Weblancer: ${weblancer.count}, Guru: ${guru.count}. По стеку: ${saved} новых, отфильтровано: ${filtered}`,
    error: errors.length ? errors.slice(0, 3).join("; ") : undefined,
  });

  return { total, byPlatform, errors };
}
