import { AGENTS } from "@/lib/agents/constants";
import { sendAgentLogToTelegram } from "@/lib/telegram-logger";
import { prisma } from "@/lib/prisma";
import { getFilterConfig } from "@/lib/filters/skills";
import type { KeywordFilterConfig } from "@/lib/filters/keyword-filter";
import { scoreTextAgainstKeywords } from "@/lib/filters/keyword-filter";
import { parseFLru } from "./fl-ru";
import { parseFreelanceRu } from "./freelance-ru";
import { parseGuru } from "./guru";
import { parseKwork } from "./kwork";
import { parseTelegramChannels } from "./telegram";
import { parseVKGroups } from "./vk";
import { parseReddit } from "./reddit";
import type { ParsedOrder } from "./types";

export { parseFLru } from "./fl-ru";
export { parseFreelanceRu } from "./freelance-ru";
export { parseGuru } from "./guru";
export { parseKwork } from "./kwork";
export { parseTelegramChannels } from "./telegram";
export { parseVKGroups } from "./vk";
export { parseReddit } from "./reddit";

export interface RunAllResult {
  /** Сколько объявлений собрали с бирж (до фильтра по стеку) */
  total: number;
  byPlatform: Record<string, number>;
  errors: string[];
  /** Сколько новых заказов реально записали в БД (все новые объявления, не только по стеку) */
  savedNew: number;
  /** Сколько объявлений не подошли под стек */
  filteredOut: number;
}

type SaveMeta = {
  status?: "NEW" | "FILTERED" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  filterScore?: number | null;
};

async function saveOrder(order: ParsedOrder, meta: SaveMeta): Promise<boolean> {
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
      clientName: order.clientName ?? null,
      skills: [],
      url: order.url,
      postedAt: order.postedAt ?? undefined,
      status: (meta.status as any) ?? undefined,
      filterScore: meta.filterScore ?? undefined,
      rawData: order.rawData as object,
    },
  });
  return true;
}

export type RunAllParsersOptions = {
  /**
   * Ключевые слова, выбранные админом (например из mini-app).
   * Если не передано — используем env/default из `lib/filters/skills.ts`.
   */
  keywordFilter?: KeywordFilterConfig;
};

export async function runAllParsers(options: RunAllParsersOptions = {}): Promise<RunAllResult> {
  const dispatcher = AGENTS.DISPATCHER;
  const start = Date.now();
  const errors: string[] = [];
  const byPlatform: Record<string, number> = {};

  await sendAgentLogToTelegram({
    agentName: dispatcher.name,
    agentId: dispatcher.id,
    action: "Запуск всех парсеров",
    status: "info",
    details:
      "FL, Freelance.ru, Guru, Kwork, Telegram (TELEGRAM_CHANNELS), VK (VK_*), Reddit (REDDIT_SUBS), Kwork — KWORK_*",
  });

  const [fl, freelanceRu, guru, kwork, tg, vk, reddit] = await Promise.all([
    parseFLru(),
    parseFreelanceRu(),
    parseGuru(),
    parseKwork(),
    parseTelegramChannels(),
    parseVKGroups(),
    parseReddit(),
  ]);

  if (fl.error) errors.push(`FL.ru: ${fl.error}`);
  if (freelanceRu.error) errors.push(`Freelance.ru: ${freelanceRu.error}`);
  if (guru.error) errors.push(`Guru: ${guru.error}`);
  if (kwork.error) errors.push(`Kwork: ${kwork.error}`);
  if (tg.error) errors.push(`Telegram: ${tg.error}`);
  if (vk.error) errors.push(`VK: ${vk.error}`);
  if (reddit.error) errors.push(`Reddit: ${reddit.error}`);

  byPlatform[fl.platform] = fl.count;
  byPlatform[freelanceRu.platform] = freelanceRu.count;
  byPlatform[guru.platform] = guru.count;
  byPlatform[kwork.platform] = kwork.count;
  byPlatform[tg.platform] = tg.count;
  byPlatform[vk.platform] = vk.count;
  byPlatform[reddit.platform] = reddit.count;

  let saved = 0;
  let filtered = 0;
  const allOrders = [
    ...fl.orders,
    ...freelanceRu.orders,
    ...guru.orders,
    ...kwork.orders,
    ...tg.orders,
    ...vk.orders,
    ...reddit.orders,
  ];

  const defaultCfg = getFilterConfig();
  const cfg: KeywordFilterConfig = options.keywordFilter
    ? options.keywordFilter
    : {
        include: defaultCfg.skills,
        exclude: defaultCfg.excludeKeywords,
        minIncludeMatches: defaultCfg.minIncludeMatches ?? 1,
      };

  for (const order of allOrders) {
    const { matches, score } = scoreTextAgainstKeywords(
      `${order.title} ${order.description ?? ""}`,
      cfg
    );

    if (!matches) filtered++;

    try {
      const normalized = Math.max(0, Math.min(1, score / 30));
      const ok = await saveOrder(order, {
        status: matches ? "FILTERED" : "NEW",
        filterScore: normalized,
      });
      if (ok) saved++;
    } catch (e) {
      errors.push(`Save: ${order.title.slice(0, 50)} - ${e}`);
    }
  }

  const duration = Date.now() - start;
  const total =
    fl.count + freelanceRu.count + guru.count + kwork.count + tg.count + vk.count + reddit.count;

  await sendAgentLogToTelegram({
    agentName: dispatcher.name,
    agentId: dispatcher.id,
    action: "Все парсеры завершены",
    status: errors.length > 0 ? "info" : "success",
    count: total,
    durationMs: duration,
    details: `FL: ${fl.count}, Freelance.ru: ${freelanceRu.count}, Guru: ${guru.count}, Kwork: ${kwork.count}, TG: ${tg.count}, VK: ${vk.count}, Reddit: ${reddit.count}. По стеку: ${saved} новых, отфильтровано: ${filtered}.`,
    error: errors.length ? errors.slice(0, 3).join("; ") : undefined,
  });

  return { total, byPlatform, errors, savedNew: saved, filteredOut: filtered };
}
