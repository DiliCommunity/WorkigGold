import { Briefcase, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Новых заказов", value: "12", icon: Briefcase, color: "text-primary" },
  { label: "Активных чатов", value: "5", icon: MessageSquare, color: "text-secondary" },
  { label: "Принято сегодня", value: "3", icon: TrendingUp, color: "text-accent-green" },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Дашборд</h1>
        <p className="text-foreground/60 mt-1">
          Обзор отфильтрованных заказов и активности
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card rounded-xl p-6 border border-white/5 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">{label}</span>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <p className="text-2xl font-bold mt-2 text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="font-semibold">Последние заказы</h2>
          <Link
            href="/orders"
            className="text-sm text-primary hover:text-primary-light transition-colors"
          >
            Все заказы →
          </Link>
        </div>
        <div className="p-6 text-center text-foreground/50">
          <p>Загружаются отфильтрованные заказы...</p>
          <p className="text-sm mt-2">
            Подключи парсер и webhook Telegram для получения данных
          </p>
        </div>
      </div>
    </div>
  );
}
