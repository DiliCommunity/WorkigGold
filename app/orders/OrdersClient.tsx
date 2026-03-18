"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiOrder } from "@/components/OrderCard";
import { OrderCard } from "@/components/OrderCard";
import { getFilterConfig } from "@/lib/filters/skills";
import type { KeywordFilterConfig } from "@/lib/filters/keyword-filter";
import { scoreTextAgainstKeywords } from "@/lib/filters/keyword-filter";

type Folder = "all" | "favorites" | "urgent";

export function OrdersClient({ initialOrders }: { initialOrders: UiOrder[] }) {
  const [orders, setOrders] = useState<UiOrder[]>(initialOrders);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<Folder>("all");
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
    for (const o of orders) map[o.platform] = (map[o.platform] || 0) + 1;
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

            <div className="grid grid-cols-3 gap-2">
              {(["all", "favorites", "urgent"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFolder(f)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm transition flex items-center justify-center gap-2",
                    activeFolder === f
                      ? "bg-secondary/15 text-secondary border-secondary/30"
                      : "bg-white/5 text-foreground/70 border-white/10 hover:border-secondary/30"
                  )}
                >
                  {f === "all" ? "Все" : f === "favorites" ? "Избранное" : "Срочно"}
                </button>
              ))}
            </div>
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

      <div className="space-y-4">
        {finalOrders.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border border-white/5">
            <p className="text-foreground/60">Ничего не найдено</p>
            <p className="text-sm text-foreground/40 mt-1">
              Попробуй поменять фильтры или выбрать другую папку/биржу
            </p>
          </div>
        ) : (
          finalOrders.map((o) => {
            const f = favorites[o.id];
            return (
              <div key={o.id} className="relative">
                <div className="absolute right-3 top-3 z-10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(o.id, "favorites")}
                    className={cn(
                      "p-2 rounded-lg border backdrop-blur",
                      f === "favorites"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-black/20 text-foreground/70 border-white/10 hover:border-primary/30"
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
                      "p-2 rounded-lg border backdrop-blur",
                      f === "urgent"
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-black/20 text-foreground/70 border-white/10 hover:border-red-500/30"
                    )}
                    aria-label="Срочно"
                    title="Срочно"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
                <OrderCard order={o} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

