"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

type Msg = { id: string; content: string; sender: string; createdAt: string };

export function ChatDetailClient({
  orderId,
  title,
  platform,
  orderUrl,
  exchangeHint,
}: {
  orderId: string;
  title: string;
  platform: string;
  orderUrl: string | null;
  exchangeHint: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?orderId=${encodeURIComponent(orderId)}`);
      if (res.ok) {
        const data = (await res.json()) as Msg[];
        setMessages(data);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, content: t }),
      });
      if (res.ok) {
        const m = (await res.json()) as Msg;
        setMessages((prev) => [...prev, m]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] max-h-[calc(100vh-0px)]">
      <header className="p-4 border-b border-white/5 bg-card flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-card-hover text-foreground/70 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{title}</h2>
            <p className="text-sm text-foreground/60">
              {platform}
              {orderUrl && (
                <>
                  {" · "}
                  <a href={orderUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Открыть на бирже
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
        <p className="text-xs text-foreground/45 sm:ml-auto sm:text-right max-w-xl">{exchangeHint}</p>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-4 min-h-0">
        {loading ? (
          <p className="text-foreground/50 text-center py-8">Загрузка сообщений…</p>
        ) : messages.length === 0 ? (
          <div className="text-center text-foreground/50 py-12 space-y-2">
            <p>Пока нет сообщений в CRM.</p>
            <p className="text-sm">
              Переписка на бирже ведётся в личном кабинете; здесь можно вести свои заметки и черновики ответов.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "ME" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-4 py-2 ${
                  msg.sender === "ME"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : msg.sender === "CLIENT"
                      ? "bg-card border border-white/5"
                      : "bg-secondary/10 border border-secondary/20 text-foreground/90"
                }`}
              >
                <p className="text-xs opacity-60 mb-1">
                  {msg.sender === "ME" ? "Вы" : msg.sender === "CLIENT" ? "Заказчик" : msg.sender}
                  {" · "}
                  {new Date(msg.createdAt).toLocaleString("ru-RU")}
                </p>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-card shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Сообщение (сохранится в CRM)…"
            className="flex-1 px-4 py-2 rounded-lg bg-background border border-white/10 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50"
          />
          <button
            type="button"
            disabled={sending || !text.trim()}
            onClick={send}
            className="p-2 rounded-lg bg-primary text-background hover:bg-primary-dark disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
