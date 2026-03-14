"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { X, ExternalLink, ChevronRight, Activity, ArrowLeft } from "lucide-react";
import { MINI_APP_AGENTS, GATHER_AGENT_IDS, type MiniAppAgent } from "@/lib/agents/mini-app-agents";
import { matchesProgrammerStack, STACK_DISPLAY } from "@/lib/filters/skills";

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
  const [selectedAgent, setSelectedAgent] = useState<MiniAppAgent | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const platformFilter = selectedAgent?.platformFilter ?? null;
  const byPlatform = platformFilter
    ? orders.filter((o) => o.platform === platformFilter)
    : orders;
  const filteredOrders = byPlatform.filter((o) =>
    matchesProgrammerStack(o.title, o.description || "")
  );

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
    setParseLoading(true);
    try {
      const res = await fetch("/api/parse", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        alert(`Найдено: ${data.total} объявлений. Логи придут в бот.`);
        await load();
      } else {
        alert("Ошибка: " + (data.error || "неизвестная"));
      }
    } catch (e) {
      alert("Ошибка запроса: " + (e instanceof Error ? e.message : String(e)));
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
                <div className="flex flex-wrap gap-2 text-sm">
                  {Object.entries(stats.byPlatform).map(([p, n]) => (
                    <span
                      key={p}
                      className="px-2 py-1 rounded bg-amber-500/20 text-amber-300"
                    >
                      {p}: {n}
                    </span>
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
            {loading ? (
              <div className="text-gray-500 text-center py-8">Загрузка...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {byPlatform.length === 0
                  ? platformFilter
                    ? `Нет заказов с ${platformFilter}. Запустите парсеры.`
                    : "Нет заказов. Запустите парсеры."
                  : `По вашему стеку ничего не найдено (из ${byPlatform.length} заказов).`}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((o) => (
                  <a
                    key={o.id}
                    href={o.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white/5 rounded-xl p-4 border border-white/10 hover:border-amber-500/30 transition"
                  >
                    <div className="font-medium line-clamp-1 flex items-start justify-between gap-2">
                      <span className="flex-1 min-w-0">{o.title}</span>
                      <ExternalLink className="w-4 h-4 shrink-0 text-amber-500/70" />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex justify-between items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                        {o.platform}
                      </span>
                      {o.budget && (
                        <span>
                          {o.budget} {o.currency}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
