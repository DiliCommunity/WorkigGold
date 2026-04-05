import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatDetailClient } from "@/components/ChatDetailClient";

export const dynamic = "force-dynamic";

function buildExchangeHint(): string {
  const parts: string[] = [];
  if (process.env.FL_RU_LOGIN?.trim()) parts.push("FL.ru: аккаунт задан");
  if (process.env.FREELANCE_RU_LOGIN?.trim()) parts.push("Freelance.ru: аккаунт задан");
  if (process.env.GURU_LOGIN?.trim()) parts.push("Guru: аккаунт задан");
  if (process.env.KWORK_LOGIN?.trim()) parts.push("Kwork: аккаунт задан");
  if (parts.length === 0) {
    return "Переменные бирж не заданы — добавьте FL_RU_LOGIN и др. в Vercel для единого профиля (синхронизация чатов планируется).";
  }
  return `${parts.join(" · ")}. Сообщения ниже — только в CRM WorkingGold.`;
}

export default async function ChatDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const order = await prisma.freelanceOrder.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      platform: true,
      url: true,
    },
  });

  if (!order) notFound();

  return (
    <ChatDetailClient
      orderId={order.id}
      title={order.title}
      platform={order.platform}
      orderUrl={order.url}
      exchangeHint={buildExchangeHint()}
    />
  );
}
