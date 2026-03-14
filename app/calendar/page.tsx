"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
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
        if (res.ok) { closeModal(); loadDeadlines(); }
      } else {
        const res = await fetch("/api/deadlines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { closeModal(); loadDeadlines(); }
      }
    } catch {}
  };

  const toggleCompleted = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/deadlines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (res.ok) loadDeadlines();
    } catch {}
  };

  const deleteDeadline = async (id: string) => {
    try {
      await fetch(`/api/deadlines/${id}`, { method: "DELETE" });
      closeModal();
      loadDeadlines();
    } catch {}
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Календарь дедлайнов</h1>
        <p className="text-foreground/60 mt-1">
          Клик по дате — добавить или изменить дедлайн. Проект, задачи, роль, стек.
        </p>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewDate(new Date(year, month - 1))}
              className="p-2 rounded-lg hover:bg-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className="px-3 py-1 text-sm rounded-lg hover:bg-white/5"
            >
              Сегодня
            </button>
            <button
              onClick={() => setViewDate(new Date(year, month + 1))}
              className="p-2 rounded-lg hover:bg-white/5"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-foreground/50 py-12 text-center">Загрузка...</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-sm font-medium text-foreground/60 py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={`e-${i}`} className="aspect-square" />;
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
                      "aspect-square rounded-lg border text-left p-1.5 transition-colors min-h-[60px]",
                      isToday
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 hover:border-primary/30 hover:bg-white/5"
                    )}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {items.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {items.slice(0, 2).map((d) => (
                          <div
                            key={d.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(d);
                            }}
                            className={cn(
                              "text-xs truncate px-1 py-0.5 rounded",
                              d.completed
                                ? "bg-foreground/10 text-foreground/50 line-through"
                                : "bg-primary/20 text-primary"
                            )}
                          >
                            {d.projectName}
                          </div>
                        ))}
                        {items.length > 2 && (
                          <div className="text-xs text-foreground/50">+{items.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {modalDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-80" />
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">
                  {editing ? "Редактировать дедлайн" : "Новый дедлайн"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg text-foreground/50 hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Проект *
                  </label>
                  <input
                    type="text"
                    value={form.projectName}
                    onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
                    placeholder="Название проекта"
                    required
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Клиент (кому сдаём)
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                    placeholder="Компания / заказчик"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Дата и время сдачи *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.deadlineAt}
                    onChange={(e) => setForm((f) => ({ ...f, deadlineAt: e.target.value }))}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Задачи (что сдать)
                  </label>
                  <textarea
                    value={form.tasks}
                    onChange={(e) => setForm((f) => ({ ...f, tasks: e.target.value }))}
                    placeholder="Список задач через Enter или запятую"
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Моя роль
                  </label>
                  <input
                    type="text"
                    value={form.myRole}
                    onChange={(e) => setForm((f) => ({ ...f, myRole: e.target.value }))}
                    placeholder="Frontend, Backend, Fullstack..."
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Стек технологий
                  </label>
                  <input
                    type="text"
                    value={form.techStack}
                    onChange={(e) => setForm((f) => ({ ...f, techStack: e.target.value }))}
                    placeholder="React, Node, PostgreSQL..."
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Заметки
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Дополнительно"
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-background font-semibold"
                  >
                    {editing ? "Сохранить" : "Добавить"}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={() => editing && toggleCompleted(editing.id, !editing.completed)}
                      className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5"
                    >
                      {editing.completed ? "Вернуть" : "Сдано"}
                    </button>
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => editing && deleteDeadline(editing.id)}
                      className="px-4 py-3 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      Удалить
                    </button>
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
