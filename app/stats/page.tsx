"use client";

import { useState } from "react";
import { BarChart3, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { StatsModal } from "@/components/StatsModal";

const initialStats = {
  accepted: 47,
  rejected: 12,
  total: 59,
};

export default function StatsPage() {
  const [stats, setStats] = useState(initialStats);
  const [showModal, setShowModal] = useState(false);

  const handleAddResult = (type: "accepted" | "rejected") => {
    setStats((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
      total: prev.total + 1,
    }));
    setShowModal(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
          <p className="text-foreground/60 mt-1">
            Принятые и отклонённые заказы
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-background hover:bg-primary-dark transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Добавить результат
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-accent-green" />
            <span className="text-foreground/60">Принято</span>
          </div>
          <p className="text-3xl font-bold text-accent-green">{stats.accepted}</p>
        </div>
        <div className="bg-card rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-foreground/60">Отклонено</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
        </div>
        <div className="bg-card rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-foreground/60">Всего обработано</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-white/5">
        <h3 className="font-semibold mb-4">Воронка</h3>
        <div className="h-8 flex rounded-lg overflow-hidden">
          <div
            className="bg-accent-green transition-all"
            style={{ width: `${(stats.accepted / stats.total) * 100}%` }}
          />
          <div
            className="bg-red-500/70 transition-all"
            style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
          />
        </div>
        <div className="flex gap-6 mt-3 text-sm">
          <span className="text-accent-green">
            {Math.round((stats.accepted / stats.total) * 100)}% принято
          </span>
          <span className="text-red-400">
            {Math.round((stats.rejected / stats.total) * 100)}% отклонено
          </span>
        </div>
      </div>

      <StatsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={() => handleAddResult("accepted")}
        onReject={() => handleAddResult("rejected")}
      />
    </div>
  );
}
