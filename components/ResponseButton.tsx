"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiOrder } from "./OrderCard";

const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141b26]";

type Props = {
  order: Pick<UiOrder, "title" | "description" | "platform" | "url">;
  className?: string;
  size?: "sm" | "md";
};

export function ResponseButton({ order, className, size = "md" }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/response-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderTitle: order.title,
          orderDescription: order.description,
          platform: order.platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Ошибка");
        return;
      }

      await navigator.clipboard.writeText(data.text);
      setStatus("success");
      setMessage("Скопировано!");

      if (order.url) {
        window.open(order.url, "_blank", "noopener,noreferrer");
      }

      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 2000);
    } catch {
      setStatus("error");
      setMessage("Ошибка копирования");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 2000);
    }
  };

  const isSmall = size === "sm";
  const btnClass = cn(
    iconBtn,
    status === "success" && "bg-accent-green/20 text-accent-green border-accent-green/30",
    status === "error" && "bg-red-500/20 text-red-400 border-red-500/30",
    status === "idle" && "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30",
    status === "loading" && "opacity-70 cursor-wait",
    isSmall && "h-8 w-8",
    className
  );

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        className={btnClass}
        disabled={status === "loading"}
        aria-label="Отправить отклик"
        title={message || "Скопировать отклик и открыть объявление"}
      >
        <Send className={isSmall ? "w-4 h-4" : "w-4 h-4"} />
      </button>
      {message && (
        <span
          className={cn(
            "text-xs whitespace-nowrap",
            status === "success" && "text-accent-green",
            status === "error" && "text-red-400"
          )}
        >
          {message}
        </span>
      )}
    </div>
  );
}
