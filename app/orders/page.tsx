import { OrderCard } from "@/components/OrderCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.freelanceOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
        <p className="text-foreground/60 mt-1">
          Отфильтрованные заказы с фриланс бирж
        </p>
      </div>

      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={{
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
                createdAt: order.createdAt,
              }}
            />
          ))
        ) : (
          <div className="bg-card rounded-xl p-12 text-center border border-white/5">
            <p className="text-foreground/60">Нет заказов</p>
            <p className="text-sm text-foreground/40 mt-1">
              Заказы будут появляться после настройки парсера и Telegram webhook
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
