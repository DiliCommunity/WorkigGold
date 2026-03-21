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
import type { ParsedOrder } from "./types";

export { parseFLru } from "./fl-ru";
export { parseFreelanceRu } from "./freelance-ru";
export { parseGuru } from "./guru";
export { parseKwork } from "./kwork";

export interface RunAllResult {
  /** Сколько объявлений собрали с бирж (до фильтра по стеку) */
  total: number;
  byPlatform: Record<string, number>;
  errors: string[];
  /** Сколько новых заказов реально записали в БД (остальные уже были) */
  savedNew: number;
  /** Сколько объявлений отсеяли по ключевым словам (не под стек) */
  filteredOut: number;
}

type SaveMeta = {
  status?: "NEW" | "FILTERED" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  filterScore?: number | null;
};

async function saveOrder(order: ParsedOrder, meta: SaveMeta): Promise<boolean> {
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
    details: "Фл-Разведчик, Фрилансру-Сканёр, Гуру-Сканёр, Кворк-Сборщик (при наличии KWORK_*)",
  });

  const [fl, freelanceRu, guru, kwork] = await Promise.all([
    parseFLru(),
    parseFreelanceRu(),
    parseGuru(),
    parseKwork(),
  ]);

  if (fl.error) errors.push(`FL.ru: ${fl.error}`);
  if (freelanceRu.error) errors.push(`Freelance.ru: ${freelanceRu.error}`);
  if (guru.error) errors.push(`Guru: ${guru.error}`);
  if (kwork.error) errors.push(`Kwork: ${kwork.error}`);

  byPlatform[fl.platform] = fl.count;
  byPlatform[freelanceRu.platform] = freelanceRu.count;
  byPlatform[guru.platform] = guru.count;
  byPlatform[kwork.platform] = kwork.count;

  let saved = 0;
  let filtered = 0;
  const allOrders = [...fl.orders, ...freelanceRu.orders, ...guru.orders, ...kwork.orders];

  const defaultCfg = getFilterConfig();
  const cfg: KeywordFilterConfig = options.keywordFilter
    ? options.keywordFilter
    : { include: defaultCfg.skills, exclude: defaultCfg.excludeKeywords, minIncludeMatches: defaultCfg.minIncludeMatches ?? 1 };

  for (const order of allOrders) {
    const { matches, score } = scoreTextAgainstKeywords(
      `${order.title} ${order.description ?? ""}`,
      cfg
    );
    if (!matches) {
      filtered++;
      continue;
    }
    try {
      // Нормализуем скор: 0..1, где 1 = много include совпадений
      const normalized = Math.max(0, Math.min(1, score / 30));
      const ok = await saveOrder(order, { status: "FILTERED", filterScore: normalized });
      if (ok) saved++;
    } catch (e) {
      errors.push(`Save: ${order.title.slice(0, 50)} - ${e}`);
    }
  }

  const duration = Date.now() - start;
  const total = fl.count + freelanceRu.count + guru.count + kwork.count;

  await sendAgentLogToTelegram({
    agentName: dispatcher.name,
    agentId: dispatcher.id,
    action: "Все парсеры завершены",
    status: errors.length > 0 ? "info" : "success",
    count: total,
    durationMs: duration,
    details: `FL: ${fl.count}, Freelance.ru: ${freelanceRu.count}, Guru: ${guru.count}, Kwork: ${kwork.count}. По стеку: ${saved} новых, отфильтровано: ${filtered}.`,
    error: errors.length ? errors.slice(0, 3).join("; ") : undefined,
  });

  return { total, byPlatform, errors, savedNew: saved, filteredOut: filtered };
}
