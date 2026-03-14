import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agent-logs?agentId=fl-razvedchik&limit=20
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  const logs = await prisma.agentLog.findMany({
    where: agentId ? { agentType: agentId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
