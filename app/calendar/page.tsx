"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Deadline = {
  id: string;
  projectName: string;
  clientName: string | null;
  deadlineAt: string;
  notes: string | null;
  tasks: string | null;
  myRole: string | null;
  techStack: string | null;
  completed: boolean;
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPadding = (first.getDay() + 6) % 7;
  const days = last.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPadding; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

export default function CalendarPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<Deadline | null>(null);
  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    deadlineAt: "",
    notes: "",
    tasks: "",
    myRole: "",
    techStack: "",
  });

  const loadDeadlines = async () => {
    try {
      const res = await fetch("/api/deadlines");
      if (res.ok) setDeadlines(await res.json());
    } catch {
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeadlines();
  }, []);

  const openModal = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dt = `${dateStr}T12:00`;
    setModalDate(dateStr);
    setEditing(null);
    setForm({
      projectName: "",
      clientName: "",
      deadlineAt: dt,
      notes: "",
      tasks: "",
      myRole: "",
      techStack: "",
    });
  };

  const openEdit = (d: Deadline) => {
    setEditing(d);
    const dt = new Date(d.deadlineAt);
    const dateStr = dt.toISOString().slice(0, 16);
    setModalDate(toDateKey(dt));
    setForm({
      projectName: d.projectName,
      clientName: d.clientName || "",
      deadlineAt: dateStr,
      notes: d.notes || "",
      tasks: d.tasks || "",
      myRole: d.myRole || "",
      techStack: d.techStack || "",
    });
  };

  const closeModal = () => {
    setModalDate(null);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName.trim() || !form.deadlineAt) return;
    try {
      const payload = {
        projectName: form.projectName.trim(),
        clientName: form.clientName.trim() || null,
        deadlineAt: form.deadlineAt,
        notes: form.notes.trim() || null,
        tasks: form.tasks.trim() || null,
        myRole: form.myRole.trim() || null,
        techStack: form.techStack.trim() || null,
      };
      if (editing) {
        const res = await fetch(`/api/deadlines/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          closeModal();
          loadDeadlines();
        }
      } else {
        const res = await fetch("/api/deadlines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          closeModal();
          loadDeadlines();
        }
      }
    } catch {
      // ignore
    }
  };

  const toggleCompleted = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/deadlines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (res.ok) loadDeadlines();
    } catch {
      // ignore
    }
  };

  const deleteDeadline = async (id: string) => {
    try {
      await fetch(`/api/deadlines/${id}`, { method: "DELETE" });
      closeModal();
      loadDeadlines();
    } catch {
      // ignore
    }
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = getDaysInMonth(year, month);
  const todayKey = toDateKey(new Date());

  const deadlinesByDate = deadlines.reduce<Record<string, Deadline[]>>((acc, d) => {
    const key = toDateKey(new Date(d.deadlineAt));
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Календарь дедлайнов
        </h1>
        <p className="text-foreground/60 mt-2 text-sm md:text-base max-w-2xl">
          Клик по дате — новый дедлайн. Клик по задаче в ячейке — редактирование.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-white/5 shadow-lg shadow-black/20 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 md:px-6 md:py-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            {MONTHS[month]} <span className="text-foreground/50 font-normal">{year}</span>
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-foreground/80 hover:bg-white/5 hover:border-primary/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewDate(new Date())}
              className="px-4 h-10 rounded-xl border border-white/10 text-sm font-medium text-foreground/90 hover:bg-primary/10 hover:border-primary/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-foreground/80 hover:bg-white/5 hover:border-primary/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 md:p-5">
          {loading ? (
            <p className="text-foreground/50 py-16 text-center text-sm">Загрузка календаря…</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-px md:gap-1 mb-2 rounded-lg overflow-hidden bg-white/5 p-px md:p-0 md:bg-transparent">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs md:text-sm font-semibold text-foreground/50 py-2 md:py-2.5 bg-card md:bg-transparent"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px md:gap-1.5">
                {cells.map((day, i) => {
                  if (day === null) {
                    return (
                      <div
                        key={`e-${i}`}
                        className="min-h-[72px] md:min-h-[88px] rounded-lg bg-white/[0.02] md:bg-transparent"
                      />
                    );
                  }
                  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const items = deadlinesByDate[dateKey] || [];
                  const isToday = dateKey === todayKey;
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => openModal(year, month, day)}
                      className={cn(
                        "min-h-[72px] md:min-h-[88px] rounded-xl border text-left p-1.5 md:p-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141b26] flex flex-col",
                        isToday
                          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(212,175,55,0.35)]"
                          : "border-white/10 bg-card hover:border-primary/35 hover:bg-white/[0.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs md:text-sm font-semibold w-7 h-7 md:w-8 md:h-8 inline-flex items-center justify-center rounded-lg",
                          isToday ? "bg-primary/25 text-primary" : "text-foreground/90"
                        )}
                      >
                        {day}
                      </span>
                      <div className="mt-1 flex-1 flex flex-col gap-0.5 min-h-0 overflow-hidden">
                        {items.slice(0, 2).map((dItem) => (
                          <div
                            key={dItem.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(dItem);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                openEdit(dItem);
                              }
                            }}
                            className={cn(
                              "text-[10px] md:text-xs truncate px-1 py-0.5 rounded-md cursor-pointer border border-transparent hover:border-white/10",
                              dItem.completed
                                ? "bg-foreground/5 text-foreground/45 line-through"
                                : "bg-primary/15 text-primary border-primary/20"
                            )}
                          >
                            {dItem.projectName}
                          </div>
                        ))}
                        {items.length > 2 && (
                          <div className="text-[10px] text-foreground/45 px-1">
                            +{items.length - 2} ещё
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {modalDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="h-1 shrink-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-90" />
            <div className="p-5 md:p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-start gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {editing ? "Редактировать дедлайн" : "Новый дедлайн"}
                  </h3>
                  <p className="text-xs text-foreground/50 mt-1">
                    {modalDate.split("-").reverse().join(".")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="shrink-0 p-2 rounded-xl text-foreground/50 hover:bg-white/5 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Проект *
                  </label>
                  <input
                    type="text"
                    value={form.projectName}
                    onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
                    placeholder="Название проекта"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-foreground placeholder:text-foreground/35 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Клиент
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                    placeholder="Компания / заказчик"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-foreground placeholder:text-foreground/35 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Дата и время сдачи *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.deadlineAt}
                    onChange={(e) => setForm((f) => ({ ...f, deadlineAt: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Задачи
                  </label>
                  <textarea
                    value={form.tasks}
                    onChange={(e) => setForm((f) => ({ ...f, tasks: e.target.value }))}
                    placeholder="Что сдать"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-foreground placeholder:text-foreground/35 resize-none outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                      Моя роль
                    </label>
                    <input
                      type="text"
                      value={form.myRole}
                      onChange={(e) => setForm((f) => ({ ...f, myRole: e.target.value }))}
                      placeholder="Frontend, Fullstack…"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-foreground placeholder:text-foreground/35 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                      Стек
                    </label>
                    <input
                      type="text"
                      value={form.techStack}
                      onChange={(e) => setForm((f) => ({ ...f, techStack: e.target.value }))}
                      placeholder="React, Node…"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-foreground placeholder:text-foreground/35 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Заметки
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Дополнительно"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-foreground placeholder:text-foreground/35 resize-none outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-background font-semibold hover:bg-primary-light transition-colors"
                  >
                    {editing ? "Сохранить" : "Добавить"}
                  </button>
                  {editing && (
                    <>
                      <button
                        type="button"
                        onClick={() => editing && toggleCompleted(editing.id, !editing.completed)}
                        className="px-4 py-3 rounded-xl border border-white/15 hover:bg-white/5 text-sm font-medium transition-colors"
                      >
                        {editing.completed ? "Вернуть" : "Сдано"}
                      </button>
                      <button
                        type="button"
                        onClick={() => editing && deleteDeadline(editing.id)}
                        className="px-4 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
