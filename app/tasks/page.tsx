"use client";

import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  source: string | null;
  startAt: string;
  duration: number;
  done: boolean;
};

const DURATIONS = [
  { v: 30, l: "30 мин" },
  { v: 60, l: "1 ч" },
  { v: 90, l: "1.5 ч" },
  { v: 120, l: "2 ч" },
  { v: 180, l: "3 ч" },
  { v: 240, l: "4 ч" },
  { v: 360, l: "6 ч" },
  { v: 480, l: "8 ч" },
];

function formatDateTime(s: string) {
  return new Date(s).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(m: number) {
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min ? `${h} ч ${min} мин` : `${h} ч`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [startAt, setStartAt] = useState("");
  const [duration, setDuration] = useState(60);

  const loadTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startAt) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          source: source.trim() || null,
          startAt,
          duration,
        }),
      });
      if (res.ok) {
        setTitle("");
        setSource("");
        loadTasks();
      }
    } catch {}
  };

  const toggleDone = async (id: string, done: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (res.ok) loadTasks();
    } catch {}
  };

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) loadTasks();
    } catch {}
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Мои задачи</h1>
      <p className="text-foreground/60 mt-1 mb-8">
        Когда смогу сесть и сколько займёт по времени. Данные в БД.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-xl border border-white/5 p-6 mb-6"
      >
        <h3 className="font-semibold mb-4">+ Добавить задачу</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm text-foreground/60 mb-1">
              Описание
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Доработать авторизацию"
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground/60 mb-1">
              Когда смогу сесть
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground/60 mb-1">
              Примерное время
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
            >
              {DURATIONS.map((d) => (
                <option key={d.v} value={d.v}>
                  {d.l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm text-foreground/60 mb-1">
              Источник (клиент / проект)
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Компания X"
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary text-background font-medium hover:bg-primary-dark"
          >
            Добавить
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-foreground/50">Загрузка...</p>
      ) : tasks.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/5 p-12 text-center text-foreground/50">
          <p>Нет задач. Добавьте задачу выше.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={`bg-card rounded-xl border border-white/5 p-4 flex items-center gap-4 ${
                t.done ? "opacity-60" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${t.done ? "line-through text-foreground/70" : ""}`}
                >
                  {t.title}
                </p>
                <p className="text-sm text-foreground/50 mt-1">
                  📅 {formatDateTime(t.startAt)} · ⏱ {formatDuration(t.duration)}
                  {t.source && ` · 📌 ${t.source}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => toggleDone(t.id, !t.done)}
                  className="p-2 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                  title={t.done ? "Вернуть" : "Выполнено"}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
