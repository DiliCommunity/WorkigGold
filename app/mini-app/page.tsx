"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { X, ExternalLink, ChevronRight, Activity, ArrowLeft } from "lucide-react";
import { MINI_APP_AGENTS, GATHER_AGENT_IDS, type MiniAppAgent } from "@/lib/agents/mini-app-agents";
import { STACK_DISPLAY, getFilterConfig } from "@/lib/filters/skills";
import type { KeywordFilterConfig } from "@/lib/filters/keyword-filter";
import { scoreTextAgainstKeywords } from "@/lib/filters/keyword-filter";

interface Order {
  id: string;
  title: string;
  description: string;
  platform: string;
  budget: number | null;
  currency: string;
  status: string;
  url: string | null;
  createdAt: string;
}

interface AgentLog {
  id: string;
  agentType: string;
  action: string;
  status: string;
  details: unknown;
  duration: number | null;
  error: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  byPlatform: Record<string, number>;
}

interface LanguageStats {
  [language: string]: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        MainButton: { show: () => void; hide: () => void; setText: (t: string) => void; onClick: (cb: () => void) => void };
        BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
      };
    };
  }
}

export default function MiniAppPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [parseLoading, setParseLoading] = useState(false);
  const [showParseModal, setShowParseModal] = useState(false);
  const [parseProgress, setParseProgress] = useState<0 | 25 | 50 | 75 | 100>(0);
  const [parseLangStats, setParseLangStats] = useState<LanguageStats | null>(null);
  const [parseTotal, setParseTotal] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<MiniAppAgent | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<"all" | "favorites" | "urgent">("all");
  const [keywordFilter, setKeywordFilter] = useState<KeywordFilterConfig>(() => {
    const def = getFilterConfig();
    return { include: def.skills, exclude: def.excludeKeywords, minIncludeMatches: 1 };
  });
  const [includeDraft, setIncludeDraft] = useState("");
  const [excludeDraft, setExcludeDraft] = useState("");
  const [minMatches, setMinMatches] = useState<number>(1);
  const [favorites, setFavorites] = useState<Record<string, "favorites" | "urgent">>({});
  const [viewMode, setViewMode] = useState<"orders" | "customers">("orders");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "budgetDesc" | "budgetAsc">("newest");
  const [activeCustomer, setActiveCustomer] = useState<string | null>(null);

  const platformFilter = selectedAgent?.platformFilter ?? null;
  const byPlatform = platformFilter
    ? orders.filter((o) => o.platform === platformFilter)
    : orders;
  const baseByPlatform = activePlatform ? byPlatform.filter((o) => o.platform === activePlatform) : byPlatform;
  const filteredOrders = baseByPlatform.filter((o) => {
    const res = scoreTextAgainstKeywords(`${o.title} ${o.description || ""}`, {
      ...keywordFilter,
      minIncludeMatches: minMatches,
    });
    return res.matches;
  });
  const folderOrders =
    activeFolder === "all"
      ? filteredOrders
      : filteredOrders.filter((o) => favorites[o.id] === activeFolder);

  const searchedOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = activeCustomer
      ? folderOrders.filter((o) => ((o as any).clientName || "").toLowerCase() === activeCustomer)
      : folderOrders;
    if (!q) return base;
    return base.filter((o) => {
      const t = `${o.title} ${o.description ?? ""}`.toLowerCase();
      return t.includes(q);
    });
  }, [folderOrders, search, activeCustomer]);

  const sortedOrders = useMemo(() => {
    const arr = [...searchedOrders];
    if (sort === "newest") {
      arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else if (sort === "budgetDesc") {
      arr.sort((a, b) => (b.budget ?? -1) - (a.budget ?? -1));
    } else if (sort === "budgetAsc") {
      arr.sort((a, b) => (a.budget ?? Number.MAX_SAFE_INTEGER) - (b.budget ?? Number.MAX_SAFE_INTEGER));
    }
    return arr;
  }, [searchedOrders, sort]);

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; count: number; lastAt: number; platforms: Set<string> }>();
    for (const o of orders as any[]) {
      const name = (o.clientName || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const item = map.get(key) ?? { name, count: 0, lastAt: 0, platforms: new Set<string>() };
      item.count += 1;
      item.platforms.add(o.platform);
      item.lastAt = Math.max(item.lastAt, +new Date(o.createdAt));
      map.set(key, item);
    }
    return Array.from(map.values()).sort((a, b) => b.lastAt - a.lastAt);
  }, [orders]);

  const languageStats = useMemo<LanguageStats>(() => {
    const stats: LanguageStats = {};
    for (const order of filteredOrders) {
      const title = `${order.title} ${order.description}`.toLowerCase();
      const languages: { key: string; label: string }[] = [
        { key: "javascript", label: "JavaScript" },
        { key: "typescript", label: "TypeScript" },
        { key: "python", label: "Python" },
        { key: "c++", label: "C++" },
        { key: "c#", label: "C#" },
        { key: "php", label: "PHP" },
        { key: "go ", label: "Go" },
        { key: "golang", label: "Go" },
        { key: "java", label: "Java" },
        { key: "rust", label: "Rust" },
      ];

      const addedForOrder = new Set<string>();
      for (const lang of languages) {
        if (title.includes(lang.key) && !addedForOrder.has(lang.label)) {
          stats[lang.label] = (stats[lang.label] || 0) + 1;
          addedForOrder.add(lang.label);
        }
      }
    }
    return stats;
  }, [filteredOrders]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (platformFilter) params.set("platform", platformFilter);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      setOrders([]);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/orders?limit=500");
      if (res.ok) {
        const data: Order[] = await res.json();
        const byPlatform: Record<string, number> = {};
        data.forEach((o) => {
          byPlatform[o.platform] = (byPlatform[o.platform] || 0) + 1;
        });
        setStats({ total: data.length, byPlatform });
      }
    } catch {
      setStats(null);
    }
  };

  const fetchAgentLogs = async (agentId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/agent-logs?agentId=${encodeURIComponent(agentId)}&limit=15`);
      if (res.ok) {
        const data = (await res.json()) as AgentLog[];
        setAgentLogs(data);
      } else {
        setAgentLogs([]);
      }
    } catch {
      setAgentLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchStats()]);
    setLoading(false);
  };

  const runParse = async () => {
    setParseError(null);
    setParseLangStats(null);
    setParseTotal(null);
    setShowParseModal(true);
    setParseProgress(25);
    setParseLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywordFilter: { ...keywordFilter, minIncludeMatches: minMatches },
        }),
      });
      setParseProgress(50);
      const data = await res.json();
      if (data.ok) {
        const total = typeof data.total === "number" ? data.total : 0;
        setParseTotal(total);

        // если API вернул распределение по языкам — используем его,
        // иначе считаем по уже отфильтрованным заказам после перезагрузки
        if (data.byLanguage && typeof data.byLanguage === "object") {
          setParseLangStats(data.byLanguage as LanguageStats);
        }

        setParseProgress(75);
        await load();

        if (!data.byLanguage) {
          setParseLangStats(languageStats);
        }
        setParseProgress(100);
      } else {
        const msg = data.error || "неизвестная ошибка";
        setParseError(msg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setParseError(msg);
    } finally {
      setParseLoading(false);
    }
  };

  const handleSelectAgent = (agent: MiniAppAgent) => {
    setSelectedAgent(agent);
    if (GATHER_AGENT_IDS.includes(agent.id)) {
      fetchAgentLogs(agent.id);
    } else {
      setAgentLogs([]);
    }
  };

  useEffect(() => {
    if (platformFilter) {
      fetchOrders();
    } else {
      load();
    }
  }, [platformFilter]);

  useEffect(() => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#1a1a2e");
      tg.BackButton.show();
      tg.BackButton.onClick(() => window.history.back());
    }
    return () => {
      tg?.BackButton?.hide?.();
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wg_keywordFilter");
      if (raw) {
        const parsed = JSON.parse(raw) as { keywordFilter?: KeywordFilterConfig; minMatches?: number };
        if (parsed.keywordFilter?.include && parsed.keywordFilter?.exclude) {
          setKeywordFilter(parsed.keywordFilter);
          setMinMatches(parsed.minMatches ?? parsed.keywordFilter.minIncludeMatches ?? 1);
        }
      }
      const favRaw = localStorage.getItem("wg_favorites");
      if (favRaw) setFavorites(JSON.parse(favRaw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "wg_keywordFilter",
        JSON.stringify({ keywordFilter, minMatches })
      );
    } catch {
      // ignore
    }
  }, [keywordFilter, minMatches]);

  useEffect(() => {
    try {
      localStorage.setItem("wg_favorites", JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      <div className="min-h-screen bg-[#1a1a2e] text-white p-4 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors shrink-0"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Назад</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold mb-4 text-amber-400">WorkingGold</h1>
          <p className="text-gray-400 text-sm mb-6">
            Управление фриланс-заказами и агентами
          </p>

          <section className="mb-6">
            <h2 className="text-sm font-medium text-gray-400 mb-2">Агенты</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {MINI_APP_AGENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelectAgent(a)}
                  className={`rounded-lg px-3 py-2 border text-left transition-all ${
                    selectedAgent?.id === a.id
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-white/5 border-white/10 hover:border-amber-500/30"
                  }`}
                >
                  <div className="font-medium flex items-center justify-between">
                    {a.name}
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="text-xs text-gray-500">{a.platform}</div>
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={runParse}
            disabled={parseLoading}
            className="w-full py-3 rounded-xl bg-amber-500/90 text-black font-semibold mb-6 disabled:opacity-50"
          >
            {parseLoading ? "Запуск парсеров..." : "Запустить парсеры"}
          </button>

          <section className="mb-6">
            <h2 className="text-sm font-medium text-gray-400 mb-2">Фильтры админа</h2>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
              <div className="text-xs text-gray-400">
                Include (через запятую) — например: <span className="text-amber-300">react, next.js, python</span>
              </div>
              <input
                value={includeDraft}
                onChange={(e) => setIncludeDraft(e.target.value)}
                placeholder="react, next.js, python"
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-500/40"
              />
              <div className="text-xs text-gray-400">
                Exclude (через запятую) — например: <span className="text-amber-300">wb, ozon, маркетплейс, дизайн</span>
              </div>
              <input
                value={excludeDraft}
                onChange={(e) => setExcludeDraft(e.target.value)}
                placeholder="wb, ozon, маркетплейс, дизайн"
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-500/40"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-400">Мин. совпадений include</div>
                <select
                  value={String(minMatches)}
                  onChange={(e) => setMinMatches(parseInt(e.target.value, 10))}
                  className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-500/40"
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-lg bg-amber-500/90 text-black text-sm font-semibold"
                  onClick={() => {
                    const include = includeDraft
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const exclude = excludeDraft
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setKeywordFilter((prev) => ({
                      ...prev,
                      include: include.length ? include : prev.include,
                      exclude: exclude.length ? exclude : prev.exclude,
                    }));
                    setIncludeDraft("");
                    setExcludeDraft("");
                  }}
                >
                  Применить
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm"
                  onClick={() => {
                    const def = getFilterConfig();
                    setKeywordFilter({ include: def.skills, exclude: def.excludeKeywords, minIncludeMatches: 1 });
                    setMinMatches(1);
                    setIncludeDraft("");
                    setExcludeDraft("");
                  }}
                >
                  Сброс
                </button>
              </div>
            </div>
          </section>

          {selectedAgent && GATHER_AGENT_IDS.includes(selectedAgent.id) && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Работа агента: {selectedAgent.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-500 hover:text-white p-1"
                  aria-label="Сбросить фильтр"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3 max-h-48 overflow-y-auto">
                {logsLoading ? (
                  <p className="text-gray-500 text-sm">Загрузка логов...</p>
                ) : agentLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Нет записей. Запустите парсеры, чтобы увидеть работу агента.
                  </p>
                ) : (
                  agentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-xs border-l-2 border-amber-500/40 pl-3 py-1"
                    >
                      <span className="text-amber-300/90">{String(log.action)}</span>
                      {log.details && typeof log.details === "object" && "count" in log.details ? (
                        <span className="text-gray-400 ml-1">
                          — {String((log.details as { count?: number }).count)} объявлений
                        </span>
                      ) : null}
                      {log.duration && (
                        <span className="text-gray-500 ml-1">({log.duration} мс)</span>
                      )}
                      <div className="text-gray-500 mt-0.5">
                        {new Date(log.createdAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-gray-500 mb-1">Фильтр по стеку:</div>
                <div className="flex flex-wrap gap-1.5">
                  {STACK_DISPLAY.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300/90 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!selectedAgent && (
            <section className="mb-6">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-gray-500 mb-1">Стек (показываются только релевантные):</div>
                <div className="flex flex-wrap gap-1.5">
                  {STACK_DISPLAY.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300/90 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {stats && !selectedAgent?.platformFilter && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-gray-400 mb-2">Статистика</h2>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-amber-400 mb-2">
                  {stats.total} заказов
                </div>
                <div className="flex flex-wrap gap-2 text-sm mb-3">
                  <button
                    type="button"
                    onClick={() => setActivePlatform(null)}
                    className={`px-2 py-1 rounded border transition ${
                      activePlatform === null
                        ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                        : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30"
                    }`}
                  >
                    Все биржи
                  </button>
                  {Object.entries(stats.byPlatform).map(([p, n]) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePlatform(p)}
                      className={`px-2 py-1 rounded border transition ${
                        activePlatform === p
                          ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                          : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30"
                      }`}
                    >
                      {p}: {n}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(["all", "favorites", "urgent"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setActiveFolder(f)}
                      className={`flex-1 px-2 py-2 rounded-lg border text-sm transition ${
                        activeFolder === f
                          ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                          : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30"
                      }`}
                    >
                      {f === "all" ? "Все" : f === "favorites" ? "Избранное" : "Срочно"}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-medium text-gray-400 mb-2">
              {selectedAgent?.platformFilter
                ? `Заказы с ${selectedAgent.platform}`
                : "Последние заказы"}
            </h2>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewMode("orders")}
                className={`px-3 py-2 rounded-lg border text-sm transition ${
                  viewMode === "orders"
                    ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                    : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30"
                }`}
              >
                Заказы
              </button>
              <button
                type="button"
                onClick={() => setViewMode("customers")}
                className={`px-3 py-2 rounded-lg border text-sm transition ${
                  viewMode === "customers"
                    ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                    : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30"
                }`}
              >
                Заказчики
              </button>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск…"
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-500/40"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-500/40"
              >
                <option value="newest">Сначала новые</option>
                <option value="budgetDesc">Бюджет ↓</option>
                <option value="budgetAsc">Бюджет ↑</option>
              </select>
            </div>
            {activeCustomer && (
              <div className="mb-3 text-xs text-gray-400 flex items-center justify-between gap-2">
                <span>Фильтр по заказчику: <span className="text-amber-200">{activeCustomer}</span></span>
                <button
                  type="button"
                  onClick={() => setActiveCustomer(null)}
                  className="px-2 py-1 rounded bg-white/10 border border-white/10 hover:border-amber-500/30"
                >
                  Сбросить
                </button>
              </div>
            )}
            {loading ? (
              <div className="text-gray-500 text-center py-8">Загрузка...</div>
            ) : viewMode === "customers" ? (
              customers.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Пока нет заказчиков (нужно, чтобы парсер сохранял clientName)
                </div>
              ) : (
                <div className="space-y-3">
                  {customers
                    .filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setViewMode("orders");
                          setActiveCustomer(c.name.toLowerCase());
                          setActiveFolder("all");
                        }}
                        className="w-full text-left bg-white/5 rounded-xl p-4 border border-white/10 hover:border-amber-500/30 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{c.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Биржи: {Array.from(c.platforms).join(", ")}
                            </div>
                          </div>
                          <div className="text-sm text-amber-300 font-semibold shrink-0">{c.count}</div>
                        </div>
                      </button>
                    ))}
                </div>
              )
            ) : sortedOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {byPlatform.length === 0
                  ? platformFilter
                    ? `Нет заказов с ${platformFilter}. Запустите парсеры.`
                    : "Нет заказов. Запустите парсеры."
                  : `По вашему стеку ничего не найдено (из ${byPlatform.length} заказов).`}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedOrders.map((o) => {
                  const fav = favorites[o.id];
                  return (
                    <div
                      key={o.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-amber-500/30 transition"
                    >
                      <div className="space-y-3">
                        <a
                          href={o.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block font-medium line-clamp-2 min-w-0 hover:text-amber-200 transition-colors"
                        >
                          {o.title}
                        </a>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-label="Добавить в избранное"
                            className={`px-2.5 py-1.5 rounded-lg text-xs border transition ${
                              fav === "favorites"
                                ? "bg-amber-500/25 border-amber-500/40 text-amber-200"
                                : "bg-white/5 border-white/10 text-gray-300 hover:border-amber-500/30"
                            }`}
                            onClick={() =>
                              setFavorites((prev) => {
                                const next = { ...prev };
                                if (next[o.id] === "favorites") delete next[o.id];
                                else next[o.id] = "favorites";
                                return next;
                              })
                            }
                          >
                            Избр.
                          </button>
                          <button
                            type="button"
                            aria-label="Пометить как срочное"
                            className={`px-2.5 py-1.5 rounded-lg text-xs border transition ${
                              fav === "urgent"
                                ? "bg-red-500/20 border-red-500/40 text-red-200"
                                : "bg-white/5 border-white/10 text-gray-300 hover:border-red-500/30"
                            }`}
                            onClick={() =>
                              setFavorites((prev) => {
                                const next = { ...prev };
                                if (next[o.id] === "urgent") delete next[o.id];
                                else next[o.id] = "urgent";
                                return next;
                              })
                            }
                          >
                            Срочно
                          </button>
                          <a
                            href={o.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Открыть заказ"
                            className="p-1.5 rounded-md border border-amber-500/20 text-amber-400/80 hover:text-amber-300 hover:border-amber-500/40 transition"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                          </a>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 flex justify-between items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                          {o.platform}
                        </span>
                        {o.budget && (
                          <span>
                            {o.budget} {o.currency}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {showParseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 rounded-2xl bg-[#111827] border border-amber-500/30 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-amber-300">Работа парсеров</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Собираем и фильтруем заказы под твой стек
                  </p>
                </div>
                {!parseLoading && (
                  <button
                    type="button"
                    onClick={() => setShowParseModal(false)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                    aria-label="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Прогресс</span>
                  <span className="text-amber-300 font-medium">
                    {parseProgress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 transition-all duration-500"
                    style={{ width: `${parseProgress}%` }}
                  />
                </div>
                {parseLoading && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Парсим FL.ru, Freelance.ru, Kwork, Habr, Guru…</span>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Ошибка при запуске парсеров: {parseError}
                </div>
              )}

              {!parseLoading && !parseError && (parseTotal !== null || (parseLangStats && Object.keys(parseLangStats).length > 0)) && (
                <div className="space-y-3">
                  {parseTotal !== null && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Найдено всего:</div>
                      <div className="text-xl font-semibold text-amber-300">
                        {parseTotal} объявлений
                      </div>
                    </div>
                  )}

                  {parseLangStats && Object.keys(parseLangStats).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400">
                          По языкам программирования
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Нажми на язык, чтобы перейти к заказам
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-0.5">
                        {Object.entries(parseLangStats)
                          .sort((a, b) => b[1] - a[1])
                          .map(([lang, count]) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                setShowParseModal(false);
                              }}
                              className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-100 text-xs flex items-center gap-1.5 border border-amber-500/30 hover:bg-amber-500/25 transition"
                            >
                              <span>{lang}</span>
                              <span className="text-[11px] bg-black/30 rounded-full px-1.5 py-0.5">
                                {count}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!parseLoading && !parseError && (
                <button
                  type="button"
                  onClick={() => setShowParseModal(false)}
                  className="w-full mt-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition"
                >
                  Смотреть отфильтрованные заказы
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
