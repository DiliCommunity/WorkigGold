import { prisma } from "@/lib/prisma";
import { SUPPORTED_PLATFORMS } from "@/lib/constants/platforms";
import { OrdersClient } from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.freelanceOrder.findMany({
    where: { platform: { in: [...SUPPORTED_PLATFORMS] } },
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <OrdersClient
      initialOrders={orders.map((order) => ({
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
      }))}
    />
  );
}
