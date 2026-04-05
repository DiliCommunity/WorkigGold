"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EXCHANGE_SERVICES, PLANNED_EXCHANGES, type ExchangeService } from "@/lib/accountant/catalog";

const STORAGE_KEY = "wg_accountant_expenses";

type ExpenseRow = {
  id: string;
  serviceId: string;
  amount: number;
  note: string;
  at: string;
};

function loadExpenses(): ExpenseRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as ExpenseRow[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function saveExpenses(rows: ExpenseRow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

const kindLabel: Record<string, string> = {
  subscription: "Подписка",
  response: "Отклик",
  promo: "Продвижение",
  commission: "Комиссия",
};

export function AccountantClient({ budgetRub }: { budgetRub: number }) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showPlanned, setShowPlanned] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [draft, setDraft] = useState({ serviceId: EXCHANGE_SERVICES[0]?.id ?? "", amount: "", note: "" });

  useEffect(() => {
    setExpenses(loadExpenses());
    setMounted(true);
  }, []);

  const spent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const remaining = Math.max(0, budgetRub - spent);
  const pct = budgetRub > 0 ? Math.min(100, (spent / budgetRub) * 100) : 0;

  const persist = useCallback((rows: ExpenseRow[]) => {
    setExpenses(rows);
    saveExpenses(rows);
  }, []);

  const addExpense = () => {
    const amt = parseFloat(draft.amount.replace(",", "."));
    if (!draft.serviceId || !Number.isFinite(amt) || amt <= 0) return;
    const row: ExpenseRow = {
      id: crypto.randomUUID(),
      serviceId: draft.serviceId,
      amount: Math.round(amt * 100) / 100,
      note: draft.note.trim(),
      at: new Date().toISOString(),
    };
    persist([...expenses, row]);
    setDraft((d) => ({ ...d, amount: "", note: "" }));
  };

  const removeExpense = (id: string) => {
    persist(expenses.filter((e) => e.id !== id));
  };

  const fetchAdvice = async () => {
    setAdviceLoading(true);
    setAdvice(null);
    try {
      const catalogSummary = EXCHANGE_SERVICES.map(
        (s) => `${s.platform}: ${s.name} ~${s.priceRub || "—"}₽`
      );
      const res = await fetch("/api/accountant/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: budgetRub,
          spent,
          catalogSummary,
        }),
      });
      const data = await res.json();
      setAdvice(typeof data.advice === "string" ? data.advice : "Нет данных");
    } catch {
      setAdvice("Не удалось получить совет");
    } finally {
      setAdviceLoading(false);
    }
  };

  const serviceById = useMemo(() => {
    const m = new Map<string, ExchangeService>();
    EXCHANGE_SERVICES.forEach((s) => m.set(s.id, s));
    return m;
  }, []);

  if (!mounted) {
    return (
      <div className="p-8 min-h-[50vh] flex items-center justify-center text-foreground/50">
        Загрузка…
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-16">
      <header className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#1a2332] via-card to-[#0f1620] p-8 md:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">ИИ-бухгалтер</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Бюджет на биржи</h1>
            <p className="text-foreground/60 mt-2 max-w-xl">
              Учёт подписок, платных откликов и комиссий. Цены в справочнике — ориентиры; проверяйте на сайтах бирж.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-2 text-foreground/50 text-sm">
              <Wallet className="w-4 h-4 text-primary" />
              Лимит (ACCOUNTANT_BUDGET_RUB)
            </div>
            <p className="text-4xl font-bold text-primary tabular-nums">
              {budgetRub.toLocaleString("ru-RU")} <span className="text-xl font-semibold">₽</span>
            </p>
          </div>
        </div>

        <div className="relative mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-black/25 border border-white/10 p-5">
            <p className="text-xs text-foreground/50 uppercase tracking-wide">Потрачено</p>
            <p className="text-2xl font-bold text-secondary tabular-nums mt-1">
              {spent.toLocaleString("ru-RU")} ₽
            </p>
          </div>
          <div className="rounded-xl bg-black/25 border border-white/10 p-5">
            <p className="text-xs text-foreground/50 uppercase tracking-wide">Остаток</p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums mt-1",
                remaining < budgetRub * 0.15 ? "text-red-400" : "text-accent-green"
              )}
            >
              {remaining.toLocaleString("ru-RU")} ₽
            </p>
          </div>
          <div className="rounded-xl bg-black/25 border border-white/10 p-5 flex flex-col justify-center">
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-foreground/50 mt-2">{pct.toFixed(1)}% бюджета использовано</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/5 bg-card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-secondary" />
            Добавить расход
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-foreground/60">Услуга из справочника</label>
            <select
              value={draft.serviceId}
              onChange={(e) => setDraft((d) => ({ ...d, serviceId: e.target.value }))}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-primary/40"
            >
              {EXCHANGE_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.platform} — {s.name}
                </option>
              ))}
            </select>
            <label className="block text-sm text-foreground/60">Сумма, ₽</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Например 590"
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-primary/40"
            />
            <label className="block text-sm text-foreground/60">Комментарий</label>
            <input
              type="text"
              placeholder="Подписка за март"
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-primary/40"
            />
            <button
              type="button"
              onClick={addExpense}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-background py-3 font-medium hover:opacity-90 transition"
            >
              <Plus className="w-5 h-5" />
              Записать расход
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-card p-6 flex flex-col">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Совет бухгалтера
          </h2>
          <p className="text-sm text-foreground/50 mt-2">
            При наличии <code className="text-primary/90">OPENAI_API_KEY</code> — краткий анализ по вашим цифрам.
          </p>
          <button
            type="button"
            disabled={adviceLoading}
            onClick={fetchAdvice}
            className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 py-3 font-medium hover:bg-amber-500/20 transition disabled:opacity-50"
          >
            {adviceLoading ? "Запрос…" : "Получить совет"}
          </button>
          {advice && (
            <div className="mt-4 flex-1 rounded-xl bg-black/20 border border-white/10 p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {advice}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/5 bg-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <Info className="w-5 h-5 text-secondary shrink-0" />
          <h2 className="text-lg font-semibold">Справочник цен (актуализируйте сами)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/50 border-b border-white/5">
                <th className="p-4 font-medium">Биржа</th>
                <th className="p-4 font-medium">Услуга</th>
                <th className="p-4 font-medium">Тип</th>
                <th className="p-4 font-medium">~₽</th>
                <th className="p-4 font-medium">Комментарий</th>
                <th className="p-4 font-medium w-10" />
              </tr>
            </thead>
            <tbody>
              {EXCHANGE_SERVICES.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-4 font-medium text-primary">{s.platform}</td>
                  <td className="p-4">{s.name}</td>
                  <td className="p-4 text-foreground/70">{kindLabel[s.kind] ?? s.kind}</td>
                  <td className="p-4 tabular-nums">
                    {s.priceRub > 0 ? `${s.priceRub.toLocaleString("ru-RU")}${s.period ? ` / ${s.period}` : ""}` : "—"}
                  </td>
                  <td className="p-4 text-foreground/60 max-w-md">{s.note}</td>
                  <td className="p-4">
                    {s.docUrl && (
                      <a
                        href={s.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-secondary hover:text-primary inline-flex"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/5 bg-card p-6">
        <h2 className="text-lg font-semibold">Журнал расходов</h2>
        {expenses.length === 0 ? (
          <p className="text-foreground/50 mt-4">Пока пусто — добавьте первую запись слева.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {expenses
              .slice()
              .reverse()
              .map((e) => {
                const svc = serviceById.get(e.serviceId);
                return (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 border border-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">
                        {svc ? `${svc.platform} — ${svc.name}` : e.serviceId}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {new Date(e.at).toLocaleString("ru-RU")}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-secondary tabular-nums">
                        −{e.amount.toLocaleString("ru-RU")} ₽
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExpense(e.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-foreground/50 hover:text-red-400"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-secondary/20 bg-gradient-to-b from-card to-[#0f1620] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPlanned((v) => !v)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.03] transition"
        >
          <div>
            <h2 className="text-lg font-semibold text-secondary">Предложения по новым биржам</h2>
            <p className="text-sm text-foreground/50 mt-1">
              Акцент на бесплатные и те, что можно парсить. Плюсы и минусы — перед подключением в код.
            </p>
          </div>
          {showPlanned ? <ChevronUp className="w-6 h-6 shrink-0" /> : <ChevronDown className="w-6 h-6 shrink-0" />}
        </button>
        {showPlanned && (
          <div className="px-6 pb-6 space-y-4">
            {PLANNED_EXCHANGES.map((ex) => (
              <div
                key={ex.name}
                className="rounded-xl border border-white/10 bg-black/20 p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{ex.name}</h3>
                  <p className="text-xs text-primary mt-2">Парсинг: {ex.freeParsing}</p>
                  <p className="text-sm text-accent-green mt-3 font-medium">Плюсы</p>
                  <ul className="list-disc list-inside text-sm text-foreground/80 mt-1 space-y-1">
                    {ex.pros.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-red-400/90 font-medium">Минусы</p>
                  <ul className="list-disc list-inside text-sm text-foreground/80 mt-1 space-y-1">
                    {ex.cons.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
