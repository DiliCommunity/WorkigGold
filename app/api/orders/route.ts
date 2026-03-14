import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const platform = searchParams.get("platform") || undefined;

  const orders = await prisma.freelanceOrder.findMany({
    where: platform ? { platform } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(orders);
}
