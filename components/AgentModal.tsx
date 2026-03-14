"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalRole = "gather" | "analyze" | "notify";

interface AgentModalAgent {
  id: string;
  name: string;
  role: ModalRole | "coordination";
  platform?: string;
  task: string;
  filterFocus?: string[];
}

const ROLE_OPTIONS: { value: ModalRole; label: string; color: string }[] = [
  { value: "gather", label: "Сбор информации", color: "bg-emerald-500/20 border-emerald-500/60 text-emerald-400" },
  { value: "analyze", label: "Анализ", color: "bg-cyan-500/20 border-cyan-500/60 text-cyan-400" },
  { value: "notify", label: "Уведомления", color: "bg-violet-500/20 border-violet-500/60 text-violet-400" },
];

const FILTER_OPTIONS = [
  { id: "budget", label: "Бюджет", desc: "Приоритет по сумме" },
  { id: "skills", label: "Навыки", desc: "Фильтр по стеку" },
  { id: "platform", label: "Платформа", desc: "Акцент на биржу" },
  { id: "urgency", label: "Срочность", desc: "По дедлайну" },
  { id: "rating", label: "Рейтинг клиента", desc: "По отзывам" },
];

interface AgentModalProps {
  agent: AgentModalAgent;
  onClose: () => void;
  onSave: (agent: AgentModalAgent) => void;
}

export function AgentModal({ agent, onClose, onSave }: AgentModalProps) {
  const [role, setRole] = useState<ModalRole>(agent.role === "coordination" ? "gather" : agent.role);
  const [task, setTask] = useState(agent.task);
  const [filters, setFilters] = useState<string[]>(agent.filterFocus ?? []);

  const toggleFilter = (id: string) => {
    setFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave({ ...agent, role: role as ModalRole, task, filterFocus: filters });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#141b26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-80" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Настройка агента</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-foreground/50 hover:bg-white/5 hover:text-foreground transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-2 text-sm font-medium text-primary">{agent.name}</div>
          {agent.platform && (
            <div className="mb-6 text-xs text-foreground/50">{agent.platform}</div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-3">
                Роль
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                      role === opt.value
                        ? opt.color
                        : "border-white/10 bg-white/5 text-foreground/60 hover:border-white/20"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Задача
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                placeholder="Описание задачи агента..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-3">
                Акцент на фильтры
              </label>
              <p className="text-xs text-foreground/50 mb-3">
                Выберите фильтры, на которые агент будет делать упор
              </p>
              <div className="space-y-2">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFilter(f.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                      filters.includes(f.id)
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-white/5 bg-white/[0.02] text-foreground/70 hover:border-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                        filters.includes(f.id)
                          ? "border-primary bg-primary"
                          : "border-foreground/30"
                      )}
                    >
                      {filters.includes(f.id) && (
                        <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{f.label}</div>
                      <div className="text-xs opacity-70">{f.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-foreground/80 hover:bg-white/5 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-background font-semibold hover:bg-primary-light transition-colors shadow-lg shadow-primary/20"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
