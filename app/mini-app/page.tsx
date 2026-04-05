"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { X, ExternalLink, ChevronRight, Activity, ArrowLeft, Star, AlertTriangle } from "lucide-react";
import { ResponseButton } from "@/components/ResponseButton";
import { iconBtn } from "@/components/OrderCard";
import { cn } from "@/lib/utils";
import { MINI_APP_AGENTS, GATHER_AGENT_IDS, type MiniAppAgent } from "@/lib/agents/mini-app-agents";
import { isSupportedPlatform } from "@/lib/constants/platforms";
import { STACK_DISPLAY, getFilterConfig, DEFAULT_MIN_INCLUDE_MATCHES } from "@/lib/filters/skills";
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
  postedAt?: string | null;
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
  const [loading, setLoading] = useState(true);
  const [parseLoading, setParseLoading] = useState(false);
  const [showParseModal, setShowParseModal] = useState(false);
  const [parseProgress, setParseProgress] = useState<0 | 25 | 50 | 75 | 100>(0);
  const [parseNewSaved, setParseNewSaved] = useState<number | null>(null);
  const [parseScanned, setParseScanned] = useState<number | null>(null);
  const [parseFilteredOut, setParseFilteredOut] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<MiniAppAgent | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<"all" | "favorites" | "urgent">("all");
  const filterConfig = useMemo((): KeywordFilterConfig => {
    const def = getFilterConfig();
    return { include: def.skills, exclude: def.excludeKeywords, minIncludeMatches: def.minIncludeMatches ?? DEFAULT_MIN_INCLUDE_MATCHES };
  }, []);
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
    const res = scoreTextAgainstKeywords(`${o.title} ${o.description || ""}`, filterConfig);
    return res.matches;
  });
  // Как на странице «Заказы»: избранное/срочно — все отмеченные по бирже, без keyword-фильтра
  const folderOrders =
    activeFolder === "all"
      ? filteredOrders
      : baseByPlatform.filter((o) => favorites[o.id] === activeFolder);

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
      arr.sort((a, b) => {
        const aDate = a.postedAt ?? a.createdAt;
        const bDate = b.postedAt ?? b.createdAt;
        return +new Date(bDate) - +new Date(aDate);
      });
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

  const byPlatformCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of orders) {
      if (isSupportedPlatform(o.platform)) m[o.platform] = (m[o.platform] || 0) + 1;
    }
    return m;
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
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
    await fetchOrders();
    setLoading(false);
  };

  const runParse = async () => {
    setParseError(null);
    setParseNewSaved(null);
    setParseScanned(null);
    setParseFilteredOut(null);
    setShowParseModal(true);
    setParseProgress(25);
    setParseLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordFilter: filterConfig }),
      });
      setParseProgress(50);
      const data = await res.json();
      if (data.ok) {
        const scanned =
          typeof data.scannedTotal === "number"
            ? data.scannedTotal
            : typeof data.total === "number"
              ? data.total
              : 0;
        const newSaved = typeof data.newSaved === "number" ? data.newSaved : 0;
        const filteredOut = typeof data.filteredOut === "number" ? data.filteredOut : 0;
        setParseScanned(scanned);
        setParseNewSaved(newSaved);
        setParseFilteredOut(filteredOut);

        setParseProgress(75);
        await load();
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
      const favRaw = localStorage.getItem("wg_favorites");
      if (favRaw) setFavorites(JSON.parse(favRaw));
    } catch {
      // ignore
    }
  }, []);

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
                <div className="text-xs text-gray-500 mb-1">Строгий фильтр по стеку (мин. 2 совпадения):</div>
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

          {!selectedAgent?.platformFilter && orders.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-gray-400 mb-2">Фильтры списка</h2>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Архив заказов — в админке «Заказы». Здесь тот же список с фильтром по вашему стеку.
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setActivePlatform(null)}
                    className={`px-3 py-1.5 rounded-lg border transition min-h-[36px] ${
                      activePlatform === null
                        ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                        : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30"
                    }`}
                  >
                    Все биржи ({orders.length})
                  </button>
                  {Object.entries(byPlatformCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([p, n]) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActivePlatform(p)}
                        className={`px-3 py-1.5 rounded-lg border transition min-h-[36px] ${
                          activePlatform === p
                            ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                            : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30"
                        }`}
                      >
                        {p}: {n}
                      </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "favorites", "urgent"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setActiveFolder(f)}
                      className={`min-h-[40px] flex-1 min-w-[100px] px-3 py-2 rounded-lg border text-sm font-medium transition flex items-center justify-center ${
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <a
                          href={o.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 font-medium text-sm sm:text-base line-clamp-2 hover:text-amber-200 transition-colors pr-0 sm:pr-2"
                        >
                          {o.title}
                        </a>
                        <div className="flex shrink-0 flex-row items-center justify-end gap-1.5 self-end sm:self-start">
                          <ResponseButton order={o} size="sm" className="border-amber-500/30 text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10" />
                          <button
                            type="button"
                            aria-label="В избранное"
                            title="В избранное"
                            className={cn(
                              iconBtn,
                              fav === "favorites"
                                ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
                                : "bg-white/5 border-white/10 text-gray-300 hover:border-amber-500/30"
                            )}
                            onClick={() =>
                              setFavorites((prev) => {
                                const next = { ...prev };
                                if (next[o.id] === "favorites") delete next[o.id];
                                else next[o.id] = "favorites";
                                return next;
                              })
                            }
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Срочно"
                            title="Срочно"
                            className={cn(
                              iconBtn,
                              fav === "urgent"
                                ? "bg-red-500/20 text-red-200 border-red-500/40"
                                : "bg-white/5 border-white/10 text-gray-300 hover:border-red-500/30"
                            )}
                            onClick={() =>
                              setFavorites((prev) => {
                                const next = { ...prev };
                                if (next[o.id] === "urgent") delete next[o.id];
                                else next[o.id] = "urgent";
                                return next;
                              })
                            }
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <a
                            href={o.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Открыть заказ"
                            className={cn(
                              iconBtn,
                              "border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50"
                            )}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-3 flex flex-wrap justify-between items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-400">
                          {o.platform}
                        </span>
                        {o.postedAt && (
                          <span className="text-gray-500">
                            {new Date(o.postedAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {o.budget != null && (
                          <span className="font-medium text-gray-400">
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
                    <span>Парсим биржи и фильтруем по стеку…</span>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Ошибка при запуске парсеров: {parseError}
                </div>
              )}

              {!parseLoading && !parseError && parseNewSaved !== null && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Новых в базу (за этот запуск)</div>
                    <div className="text-2xl font-bold text-amber-300 tabular-nums">
                      {parseNewSaved}
                    </div>
                    {parseNewSaved === 0 && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Все проверенные объявления уже были в «Заказах» или не прошли фильтр по стеку. Это нормально.
                      </p>
                    )}
                  </div>
                  {parseScanned !== null && (
                    <div className="text-xs text-gray-500 space-y-1 border-t border-white/10 pt-3">
                      <div className="flex justify-between gap-2">
                        <span>Просмотрено на биржах</span>
                        <span className="text-gray-400 tabular-nums">{parseScanned}</span>
                      </div>
                      {parseFilteredOut !== null && (
                        <div className="flex justify-between gap-2">
                          <span>Отсеяно фильтром стека</span>
                          <span className="text-gray-400 tabular-nums">{parseFilteredOut}</span>
                        </div>
                      )}
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
                  К списку заказов
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
