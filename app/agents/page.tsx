"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AgentModal } from "@/components/AgentModal";

type Role = "gather" | "analyze" | "notify" | "coordination";

interface Agent {
  id: string;
  name: string;
  role: Role;
  platform?: string;
  task: string;
  filterFocus?: string[];
}

interface ChatMessage {
  role: "bot" | "user";
  text: string;
  targetId?: string;
}

const INITIAL_AGENTS: Agent[] = [
  { id: "fl", name: "Фл-Разведчик", role: "gather", platform: "FL.ru", task: "Сканирует FL.ru" },
  { id: "kwork", name: "Кворк-Сборщик", role: "gather", platform: "Kwork", task: "Собирает заказы Kwork" },
  { id: "habr", name: "Хабр-Дозорный", role: "gather", platform: "Habr", task: "Мониторит Habr" },
  { id: "weblancer", name: "Веблансер-Сканёр", role: "gather", platform: "Weblancer", task: "Сканирует Weblancer" },
  { id: "filter", name: "Просеиватель", role: "analyze", platform: "", task: "Фильтрация по критериям" },
  { id: "scorer", name: "Оценщик", role: "analyze", platform: "", task: "Оценка релевантности" },
  { id: "sorter", name: "Сортировщик", role: "analyze", platform: "", task: "Сортировка по приоритету" },
  { id: "vestnik", name: "Вестник", role: "notify", platform: "Telegram", task: "Уведомления в бот" },
];

const ROLE_LABELS: Record<Role, string> = {
  gather: "Сбор",
  analyze: "Анализ",
  notify: "Уведомления",
  coordination: "Координация",
};

const ROLE_STYLES: Record<Role, string> = {
  gather: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
  analyze: "border-cyan-500/60 bg-cyan-500/10 text-cyan-400",
  notify: "border-violet-500/60 bg-violet-500/10 text-violet-400",
  coordination: "border-amber-500/60 bg-amber-500/15 text-amber-400",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [gatherCount, setGatherCount] = useState(4);
  const [analyzeCount, setAnalyzeCount] = useState(2);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "Привет! Я Прораб. Напиши, какую задачу поставить агентам: усилить сбор с бирж или анализ заказов." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatTargetAgentId, setChatTargetAgentId] = useState<string>("dispatcher");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const gatherers = agents.filter((a) => a.role === "gather");
  const analyzers = agents.filter((a) => a.role === "analyze");
  const notifiers = agents.filter((a) => a.role === "notify");

  const updateAgent = (updated: Agent) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  const activeGatherers = gatherers.slice(0, Math.min(gatherCount, gatherers.length));
  const activeAnalyzers = analyzers.slice(0, Math.min(analyzeCount, analyzers.length));
  const chatTargetAgent = agents.find((a) => a.id === chatTargetAgentId);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((m) => [...m, { role: "user", text, targetId: chatTargetAgentId }]);
    setChatInput("");
    const lower = text.toLowerCase();
    const isContractTask =
      lower.includes("договор") || lower.includes("заказчик") || lower.includes("чат");
    const targetName = chatTargetAgent?.name ?? "агент";
    const acknowledgement = isContractTask
      ? `Принято. Передал ${targetName} задачу: открыть чат с заказчиком и согласовать договор по заказу.`
      : `Принято. Передал задачу агенту ${targetName}.`;
    setChatMessages((m) => [...m, { role: "bot", text: acknowledgement, targetId: chatTargetAgentId }]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Иерархия агентов</h1>
        <p className="text-foreground/60 mt-1">
          Прораб координирует сборщиков и аналитиков. Чат с Прорабом — управление задачами.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6">
            <h3 className="text-primary font-semibold mb-4">Настройка ролей</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-foreground/70 block mb-1">
                  На сбор информации
                </label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={gatherCount}
                  onChange={(e) => setGatherCount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-primary ml-2 font-medium">{gatherCount}</span>
              </div>
              <div>
                <label className="text-sm text-foreground/70 block mb-1">
                  На анализ
                </label>
                <input
                  type="range"
                  min={0}
                  max={3}
                  value={analyzeCount}
                  onChange={(e) => setAnalyzeCount(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <span className="text-cyan-400 ml-2 font-medium">{analyzeCount}</span>
              </div>
              <div className="flex gap-4 text-xs text-foreground/50">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-500" /> Сбор
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-cyan-500" /> Анализ
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-violet-500" /> Уведомления
                </span>
              </div>
            </div>
          </div>

          <div
            ref={diagramRef}
            className="glass rounded-xl p-8 min-h-[420px] relative overflow-hidden"
          >
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ minHeight: 400 }}
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8" fill="rgba(212,175,55,0.5)" />
                </marker>
              </defs>
              <line
                x1="50%"
                y1="80"
                x2="50%"
                y2="140"
                stroke="rgba(212,175,55,0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <line
                x1="50%"
                y1="200"
                x2="50%"
                y2="260"
                stroke="rgba(212,175,55,0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {activeGatherers.length + activeAnalyzers.length + notifiers.length > 0 && (
                <>
                  {[120, 200].map((y, i) => (
                    <line
                      key={i}
                      x1="50%"
                      y1={y + 60}
                      x2="50%"
                      y2={280}
                      stroke="rgba(212,175,55,0.2)"
                      strokeWidth="1"
                    />
                  ))}
                </>
              )}
            </svg>

            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "px-6 py-3 rounded-xl border-2 font-semibold",
                  ROLE_STYLES.coordination
                )}
              >
                Прораб
                <div className="text-xs opacity-80 mt-1">Чат / Координация</div>
              </div>
              <div className="h-8" />
              <div
                className={cn(
                  "px-6 py-3 rounded-xl border-2 font-semibold",
                  "border-secondary/60 bg-secondary/10 text-secondary"
                )}
              >
                Диспетчер
                <div className="text-xs opacity-80 mt-1">Оркестрация</div>
              </div>
              <div className="h-8" />
              <div className="flex flex-wrap justify-center gap-4">
                {activeGatherers.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAgent(a)}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 text-sm font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/10",
                      ROLE_STYLES.gather
                    )}
                  >
                    {a.name}
                    <div className="text-xs opacity-80 mt-0.5">
                      {ROLE_LABELS.gather} • {a.platform}
                    </div>
                  </button>
                ))}
                {activeAnalyzers.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAgent(a)}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 text-sm font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/10",
                      ROLE_STYLES.analyze
                    )}
                  >
                    {a.name}
                    <div className="text-xs opacity-80 mt-0.5">{ROLE_LABELS.analyze}</div>
                  </button>
                ))}
                {notifiers.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAgent(a)}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 text-sm font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-lg hover:shadow-violet-500/10",
                      ROLE_STYLES.notify
                    )}
                  >
                    {a.name}
                    <div className="text-xs opacity-80 mt-0.5">
                      {ROLE_LABELS.notify}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl flex flex-col h-fit max-h-[500px]">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
              П
            </div>
            <div>
              <div className="font-semibold">Прораб</div>
              <div className="text-xs text-foreground/50">Координирует агентов</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl px-4 py-2 max-w-[90%]",
                  m.role === "bot"
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary/15 text-secondary ml-auto"
                )}
              >
                {m.targetId && (
                  <div className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">
                    {agents.find((a) => a.id === m.targetId)?.name ?? "Агент"}
                  </div>
                )}
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-white/5">
            <div className="mb-2">
              <label className="block text-xs text-foreground/50 mb-1">Кому ставим задачу</label>
              <select
                value={chatTargetAgentId}
                onChange={(e) => setChatTargetAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.platform ? `(${a.platform})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Задача выбранному агенту..."
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-foreground/40"
            />
          </div>
        </div>
      </div>

      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSave={updateAgent}
        />
      )}

      <p className="mt-6 text-sm text-foreground/50">
        Standalone HTML (открыть в браузере или по ссылке):{" "}
        <a
          href="/agents-hierarchy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          /agents-hierarchy.html
        </a>{" "}
        · Локально: <code className="text-foreground/70">static/agents-hierarchy.html</code>
      </p>
    </div>
  );
}
