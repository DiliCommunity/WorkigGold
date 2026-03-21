"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiOrder } from "@/components/OrderCard";
import { OrderCard, iconBtn } from "@/components/OrderCard";
import { SUPPORTED_PLATFORMS } from "@/lib/constants/platforms";
import { getFilterConfig } from "@/lib/filters/skills";
import type { KeywordFilterConfig } from "@/lib/filters/keyword-filter";
import { scoreTextAgainstKeywords } from "@/lib/filters/keyword-filter";

type Folder = "all" | "favorites" | "urgent";
type ViewMode = "orders" | "customers";

export function OrdersClient({ initialOrders }: { initialOrders: UiOrder[] }) {
  const [orders, setOrders] = useState<UiOrder[]>(initialOrders);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<Folder>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("orders");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "budgetDesc" | "budgetAsc">("newest");
  const [activeCustomer, setActiveCustomer] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, Folder>>({});

  const [keywordFilter, setKeywordFilter] = useState<KeywordFilterConfig>(() => {
    const def = getFilterConfig();
    return { include: def.skills, exclude: def.excludeKeywords, minIncludeMatches: 1 };
  });
  const [includeDraft, setIncludeDraft] = useState("");
  const [excludeDraft, setExcludeDraft] = useState("");
  const [minMatches, setMinMatches] = useState<number>(1);

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
      localStorage.setItem("wg_favorites", JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const byPlatformCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      if (SUPPORTED_PLATFORMS.includes(o.platform as (typeof SUPPORTED_PLATFORMS)[number])) {
        map[o.platform] = (map[o.platform] || 0) + 1;
      }
    }
    return map;
  }, [orders]);

  const platformFiltered = useMemo(() => {
    return activePlatform ? orders.filter((o) => o.platform === activePlatform) : orders;
  }, [orders, activePlatform]);

  const keywordFiltered = useMemo(() => {
    return platformFiltered.filter((o) => {
      const res = scoreTextAgainstKeywords(`${o.title} ${o.description ?? ""}`, {
        ...keywordFilter,
        minIncludeMatches: minMatches,
      });
      return res.matches;
    });
  }, [platformFiltered, keywordFilter, minMatches]);

  // В папках (избранное/срочно) показываем то, что пользователь пометил,
  // без привязки к бирже и без keyword-фильтра.
  const finalOrders = useMemo(() => {
    if (activeFolder === "all") return keywordFiltered;
    const ids = new Set(Object.entries(favorites).filter(([, f]) => f === activeFolder).map(([id]) => id));
    return orders.filter((o) => ids.has(o.id));
  }, [activeFolder, favorites, keywordFiltered, orders]);

  const searchedOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = activeCustomer ? finalOrders.filter((o) => (o.clientName || "").toLowerCase() === activeCustomer) : finalOrders;
    if (!q) return base;
    return base.filter((o) => {
      const t = `${o.title} ${o.description ?? ""} ${(o.clientName ?? "")}`.toLowerCase();
      return t.includes(q);
    });
  }, [finalOrders, search, activeCustomer]);

  const sortedOrders = useMemo(() => {
    const arr = [...searchedOrders];
    if (sort === "newest") {
      arr.sort((a, b) => {
        const aDate = (a as UiOrder & { postedAt?: string | null }).postedAt ?? a.createdAt;
        const bDate = (b as UiOrder & { postedAt?: string | null }).postedAt ?? b.createdAt;
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
    for (const o of orders) {
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

  const toggle = (id: string, folder: Exclude<Folder, "all">) => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[id] === folder) delete next[id];
      else next[id] = folder;
      return next;
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
          <p className="text-foreground/60 mt-1">Отфильтрованные заказы с фриланс бирж</p>
        </div>

        <div className="bg-card rounded-xl border border-white/5 p-4">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewMode("orders")}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm transition",
                  viewMode === "orders"
                    ? "bg-secondary/15 text-secondary border-secondary/30"
                    : "bg-white/5 text-foreground/70 border-white/10 hover:border-secondary/30"
                )}
              >
                Заказы
              </button>
              <button
                type="button"
                onClick={() => setViewMode("customers")}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm transition",
                  viewMode === "customers"
                    ? "bg-secondary/15 text-secondary border-secondary/30"
                    : "bg-white/5 text-foreground/70 border-white/10 hover:border-secondary/30"
                )}
              >
                Заказчики
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActivePlatform(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm transition",
                  activePlatform === null
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-white/5 text-foreground/70 border-white/10 hover:border-primary/30"
                )}
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
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-sm transition",
                      activePlatform === p
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-white/5 text-foreground/70 border-white/10 hover:border-primary/30"
                    )}
                  >
                    {p} ({n})
                  </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "favorites", "urgent"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFolder(f)}
                  className={cn(
                    "min-h-[40px] flex-1 min-w-[100px] px-3 py-2 rounded-lg border text-sm font-medium transition flex items-center justify-center",
                    activeFolder === f
                      ? "bg-secondary/15 text-secondary border-secondary/30"
                      : "bg-white/5 text-foreground/70 border-white/10 hover:border-secondary/30"
                  )}
                >
                  {f === "all" ? "Все" : f === "favorites" ? "Избранное" : "Срочно"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по заказам/заказчикам…"
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/40 md:col-span-2"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/40"
              >
                <option value="newest">Сначала новые</option>
                <option value="budgetDesc">Бюджет ↓</option>
                <option value="budgetAsc">Бюджет ↑</option>
              </select>
            </div>

            {activeCustomer && (
              <div className="text-xs text-foreground/60 flex items-center justify-between gap-3">
                <span>Фильтр по заказчику: <span className="text-foreground">{activeCustomer}</span></span>
                <button
                  type="button"
                  onClick={() => setActiveCustomer(null)}
                  className="px-2 py-1 rounded bg-white/10 border border-white/10 hover:border-primary/30"
                >
                  Сбросить
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-white/5 p-4">
          <div className="text-sm font-medium text-foreground mb-3">Фильтры админа</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-foreground/60 mb-1">Include (через запятую)</div>
              <input
                value={includeDraft}
                onChange={(e) => setIncludeDraft(e.target.value)}
                placeholder="react, next.js, python"
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <div className="text-xs text-foreground/60 mb-1">Exclude (через запятую)</div>
              <input
                value={excludeDraft}
                onChange={(e) => setExcludeDraft(e.target.value)}
                placeholder="ozon, wb, маркетплейс, дизайн"
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-foreground/60">Мин. совпадений include</div>
              <select
                value={String(minMatches)}
                onChange={(e) => setMinMatches(parseInt(e.target.value, 10))}
                className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/40"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 md:ml-auto">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-primary/90 text-black text-sm font-semibold"
                onClick={() => {
                  const include = includeDraft.split(",").map((s) => s.trim()).filter(Boolean);
                  const exclude = excludeDraft.split(",").map((s) => s.trim()).filter(Boolean);
                  setKeywordFilter((prev) => ({
                    ...prev,
                    include: include.length ? include : prev.include,
                    exclude: exclude.length ? exclude : prev.exclude,
                  }));
                  try {
                    localStorage.setItem("wg_keywordFilter", JSON.stringify({ keywordFilter: { ...keywordFilter, include, exclude }, minMatches }));
                  } catch {
                    // ignore
                  }
                  setIncludeDraft("");
                  setExcludeDraft("");
                }}
              >
                Применить
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm"
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
          {activeFolder !== "all" && (
            <div className="mt-3 text-xs text-foreground/50 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              В папках «Избранное/Срочно» показываем отмеченные заказы без keyword‑фильтра и без биржи.
            </div>
          )}
        </div>
      </div>

      {viewMode === "customers" ? (
        <div className="space-y-3">
          {customers.length === 0 ? (
            <div className="bg-card rounded-xl p-12 text-center border border-white/5">
              <p className="text-foreground/60">Пока нет заказчиков</p>
              <p className="text-sm text-foreground/40 mt-1">
                Когда парсеры начнут сохранять имена заказчиков, тут появится список
              </p>
            </div>
          ) : (
            customers
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
                  className="w-full text-left bg-card rounded-xl border border-white/5 hover:border-primary/20 transition p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{c.name}</div>
                      <div className="text-xs text-foreground/50 mt-1">
                        Биржи: {Array.from(c.platforms).join(", ")}
                      </div>
                    </div>
                    <div className="text-sm text-primary font-semibold shrink-0">
                      {c.count}
                    </div>
                  </div>
                </button>
              ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border border-white/5">
            <p className="text-foreground/60">Ничего не найдено</p>
            <p className="text-sm text-foreground/40 mt-1">
              Попробуй поменять фильтры или выбрать другую папку/биржу
            </p>
          </div>
        ) : (
          sortedOrders.map((o) => {
            const f = favorites[o.id];
            return (
              <OrderCard
                key={o.id}
                order={o}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => toggle(o.id, "favorites")}
                      className={cn(
                        iconBtn,
                        f === "favorites"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-white/5 text-foreground/70 border-white/10 hover:border-primary/30"
                      )}
                      aria-label="В избранное"
                      title="В избранное"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(o.id, "urgent")}
                      className={cn(
                        iconBtn,
                        f === "urgent"
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : "bg-white/5 text-foreground/70 border-white/10 hover:border-red-500/30"
                      )}
                      aria-label="Срочно"
                      title="Срочно"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </>
                }
              />
            );
          })
        )}
      </div>
      )}
    </div>
  );
}

