import { OrderCard } from "@/components/OrderCard";
import { orders } from "@/lib/mock-data";

export default function OrdersPage() {
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
          orders.map((order) => <OrderCard key={order.id} order={order} />)
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
