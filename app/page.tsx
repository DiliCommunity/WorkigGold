import { Briefcase, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_PLATFORMS } from "@/lib/constants/platforms";
import { OrderCard } from "@/components/OrderCard";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const platformFilter = { platform: { in: [...SUPPORTED_PLATFORMS] } };

  const [newOrdersCount, activeChatsCount, acceptedTodayCount, recentOrders] = await Promise.all([
    prisma.freelanceOrder.count({
      where: { ...platformFilter, status: { in: ["NEW", "FILTERED"] } },
    }),
    prisma.freelanceOrder.count({
      where: { ...platformFilter, messages: { some: {} } },
    }),
    prisma.statusHistory.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.freelanceOrder.findMany({
      where: platformFilter,
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
  ]);

  // Если в StatusHistory нет записей, считаем по orders с APPROVED
  let acceptedToday = acceptedTodayCount;
  if (acceptedToday === 0) {
    acceptedToday = await prisma.freelanceOrder.count({
      where: {
        status: "APPROVED",
        updatedAt: { gte: startOfToday },
      },
    });
  }

  return {
    newOrders: newOrdersCount,
    activeChats: activeChatsCount,
    acceptedToday,
    recentOrders,
  };
}

export default async function DashboardPage() {
  let newOrders = 0;
  let activeChats = 0;
  let acceptedToday = 0;
  let recentOrders: Awaited<ReturnType<typeof prisma.freelanceOrder.findMany>> = [];

  try {
    const data = await getDashboardData();
    newOrders = data.newOrders;
    activeChats = data.activeChats;
    acceptedToday = data.acceptedToday;
    recentOrders = data.recentOrders;
  } catch (e) {
    console.error("Dashboard data fetch error:", e);
  }

  const stats = [
    { label: "Новых заказов", value: String(newOrders), icon: Briefcase, color: "text-primary" },
    { label: "Активных чатов", value: String(activeChats), icon: MessageSquare, color: "text-secondary" },
    { label: "Принято сегодня", value: String(acceptedToday), icon: TrendingUp, color: "text-accent-green" },
  ];

  const uiOrders = recentOrders.map((order) => ({
    id: order.id,
    title: order.title,
    description: order.description,
    platform: order.platform,
    budget: order.budget,
    currency: order.currency,
    clientName: order.clientName,
    skills: order.skills,
    status: order.status,
    filterScore: order.filterScore,
    url: order.url,
    createdAt: order.createdAt.toISOString(),
    postedAt: order.postedAt?.toISOString() ?? null,
  }));

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
        <div className="p-6">
          {uiOrders.length > 0 ? (
            <div className="space-y-4">
              {uiOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="text-center text-foreground/50 py-8">
              <p>Пока нет заказов</p>
              <p className="text-sm mt-2">
                Запусти парсер (/parse в Telegram или кнопку в Mini App) или подключи webhook Telegram для автоматического сбора
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
