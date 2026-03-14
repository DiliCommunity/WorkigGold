"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export function StatsModal({
  isOpen,
  onClose,
  onAccept,
  onReject,
}: StatsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl border border-white/10 p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2">Добавить результат</h3>
        <p className="text-foreground/70 text-sm mb-6">
          Какой итог по этому заказу?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green/30 border border-accent-green/30 transition-colors font-medium"
          >
            <TrendingUp className="w-5 h-5" />
            Принят
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors font-medium"
          >
            <TrendingDown className="w-5 h-5" />
            Отклонён
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-foreground/60 hover:text-foreground transition-colors text-sm"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
