"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

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
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export default function MiniAppPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [parseLoading, setParseLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?limit=20");
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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#1a1a2e");
    }
  }, []);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-[#1a1a2e] text-white p-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold mb-4 text-amber-400">WorkingGold</h1>
          <p className="text-gray-400 text-sm mb-6">
            Управление фриланс-заказами и агентами
          </p>

          <section className="mb-6">
            <h2 className="text-sm font-medium text-gray-400 mb-2">Агенты</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { name: "Фл-Разведчик", platform: "FL.ru" },
                { name: "Кворк-Сборщик", platform: "Kwork" },
                { name: "Хабр-Дозорный", platform: "Habr" },
                { name: "Веблансер-Сканёр", platform: "Weblancer" },
                { name: "Диспетчер", platform: "Все" },
                { name: "Вестник", platform: "Уведомления" },
              ].map((a) => (
                <div
                  key={a.name}
                  className="bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                >
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.platform}</div>
                </div>
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

          {stats && (
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
            <h2 className="text-sm font-medium text-gray-400 mb-2">Последние заказы</h2>
            {loading ? (
              <div className="text-gray-500 text-center py-8">Загрузка...</div>
            ) : orders.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Нет заказов. Запустите парсеры.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 10).map((o) => (
                  <a
                    key={o.id}
                    href={o.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white/5 rounded-xl p-4 border border-white/10 hover:border-amber-500/30 transition"
                  >
                    <div className="font-medium line-clamp-1">{o.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>{o.platform}</span>
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
