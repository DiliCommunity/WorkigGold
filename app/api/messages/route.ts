import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId обязателен" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      sender: m.sender,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body.orderId as string | undefined;
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!orderId || !content) {
      return NextResponse.json({ error: "orderId и content обязательны" }, { status: 400 });
    }

    const order = await prisma.freelanceOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const msg = await prisma.message.create({
      data: {
        orderId,
        content,
        sender: "ME",
      },
    });

    return NextResponse.json({
      id: msg.id,
      content: msg.content,
      sender: msg.sender,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
