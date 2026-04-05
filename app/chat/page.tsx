import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const orders = await prisma.freelanceOrder.findMany({
    where: {
      OR: [
        { status: { in: ["APPROVED", "IN_PROGRESS", "FILTERED", "NEW"] } },
        { messages: { some: {} } },
      ],
    },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const displayName =
    process.env.CHAT_DISPLAY_NAME?.trim() || process.env.RESUME_NAME?.trim() || null;

  return (
    <div className="p-4 md:p-8 h-full flex flex-col lg:flex-row gap-6 min-h-0">
      <div className="w-full lg:w-96 bg-card rounded-xl border border-white/5 flex flex-col shrink-0 max-h-[50vh] lg:max-h-none lg:self-stretch">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-semibold">Чаты с заказчиками</h2>
          <p className="text-sm text-foreground/60 mt-1">
            CRM-переписка по заказам из базы. Реальный диалог на бирже — в кабинете биржи.
          </p>
          {displayName && (
            <p className="text-xs text-primary mt-2">
              Подпись в интерфейсе: <span className="font-medium text-foreground">{displayName}</span>
            </p>
          )}
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {orders.length === 0 ? (
            <div className="p-6 text-sm text-foreground/50 text-center">
              Нет заказов для чата. Одобрите заказ или добавьте сообщение к заказу из списка заказов (скоро).
            </div>
          ) : (
            orders.map((chat) => {
              const last = chat.messages[0];
              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-card-hover border-b border-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.clientName || "Заказчик"}</p>
                    <p className="text-sm text-foreground/60 truncate">{chat.title}</p>
                    {last && (
                      <p className="text-xs text-foreground/40 truncate mt-0.5">{last.content}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground/40 shrink-0" />
                </Link>
              );
            })
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center text-foreground/50 py-12 rounded-xl border border-dashed border-white/10">
        <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
        <p>Выберите чат слева</p>
        <p className="text-sm mt-2 max-w-md">
          Учётные данные бирж (логины) задайте в Vercel — они пригодятся для будущей синхронизации; сейчас сообщения
          хранятся только в этой панели.
        </p>
      </div>
    </div>
  );
}
