"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const mockMessages = [
  { id: "1", content: "Здравствуйте! Интересует ваш отклик на проект.", sender: "client" },
  { id: "2", content: "Привет! Да, готов обсудить детали.", sender: "me" },
  { id: "3", content: "Отлично! Когда можете начать?", sender: "client" },
];

export default function ChatDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      <header className="p-4 border-b border-white/5 bg-card flex items-center gap-4">
        <Link
          href="/chat"
          className="p-2 rounded-lg hover:bg-card-hover text-foreground/70"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-semibold">Чат #{id}</h2>
          <p className="text-sm text-foreground/60">Заказ с фриланс биржи</p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {mockMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-xl px-4 py-2 ${
                msg.sender === "me"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-card border border-white/5"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/5 bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Сообщение..."
            className="flex-1 px-4 py-2 rounded-lg bg-background border border-white/10 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50"
          />
          <button className="p-2 rounded-lg bg-primary text-background hover:bg-primary-dark">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
