"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Check, Trash2 } from "lucide-react";

type Deadline = {
  id: string;
  projectName: string;
  clientName: string | null;
  deadlineAt: string;
  notes: string | null;
  completed: boolean;
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatDateTime(s: string) {
  return new Date(s).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [notes, setNotes] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !deadlineAt) return;
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName.trim(),
          clientName: clientName.trim() || null,
          deadlineAt,
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        setProjectName("");
        setClientName("");
        setDeadlineAt("");
        setNotes("");
        setShowForm(false);
        loadDeadlines();
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
      const res = await fetch(`/api/deadlines/${id}`, { method: "DELETE" });
      if (res.ok) loadDeadlines();
    } catch {}
  };

  const now = new Date();
  const upcoming = deadlines.filter(
    (d) => !d.completed && new Date(d.deadlineAt) >= now
  );
  const past = deadlines.filter(
    (d) => d.completed || new Date(d.deadlineAt) < now
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Календарь дедлайнов</h1>
          <p className="text-foreground/60 mt-1">
            Когда и кому сдавать проект. История в БД.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-background font-medium hover:bg-primary-dark flex items-center gap-2"
        >
          <CalendarIcon className="w-5 h-5" />
          Добавить дедлайн
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl border border-white/5 p-6 mb-6"
        >
          <h3 className="font-semibold mb-4">Новый дедлайн</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-foreground/60 mb-1">
                Название проекта *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Работа над API"
                required
                className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/60 mb-1">
                Кому сдаём (клиент)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Компания X"
                className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/60 mb-1">
                Дата и время сдачи *
              </label>
              <input
                type="datetime-local"
                value={deadlineAt}
                onChange={(e) => setDeadlineAt(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/60 mb-1">
                Заметки
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Что именно сдать"
                className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-foreground focus:border-primary/50 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-background font-medium"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-white/10 text-foreground/70 hover:bg-card-hover"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-foreground/50">Загрузка...</p>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Предстоящие
              </h2>
              <div className="space-y-3">
                {upcoming.map((d) => (
                  <div
                    key={d.id}
                    className="bg-card rounded-xl border border-secondary/30 p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{d.projectName}</p>
                      <p className="text-sm text-foreground/60">
                        {d.clientName && `${d.clientName} · `}
                        {formatDateTime(d.deadlineAt)}
                        {d.notes && ` · ${d.notes}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => toggleCompleted(d.id, true)}
                        className="p-2 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                        title="Сдано"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteDeadline(d.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-foreground/40" />
              История
            </h2>
            {past.length === 0 ? (
              <div className="bg-card rounded-xl border border-white/5 p-12 text-center text-foreground/50">
                Нет записей. Добавьте дедлайн и отметьте сданные.
              </div>
            ) : (
              <div className="space-y-3">
                {past.map((d) => (
                  <div
                    key={d.id}
                    className={`bg-card rounded-xl border border-white/5 p-4 flex items-center gap-4 ${
                      d.completed ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={
                          d.completed ? "line-through text-foreground/70" : ""
                        }
                      >
                        {d.projectName}
                      </p>
                      <p className="text-sm text-foreground/50">
                        {d.clientName && `${d.clientName} · `}
                        {formatDate(d.deadlineAt)}
                        {d.completed && " · Сдано"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {d.completed ? (
                        <button
                          onClick={() => toggleCompleted(d.id, false)}
                          className="text-sm text-foreground/50 hover:text-foreground"
                        >
                          Вернуть
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleCompleted(d.id, true)}
                          className="p-2 rounded-lg bg-accent-green/20 text-accent-green"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteDeadline(d.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
