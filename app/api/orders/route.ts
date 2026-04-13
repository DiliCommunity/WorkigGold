import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_PLATFORMS } from "@/lib/constants/platforms";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500);
    const platform = searchParams.get("platform") || undefined;

    const validPlatform =
      platform && SUPPORTED_PLATFORMS.includes(platform as (typeof SUPPORTED_PLATFORMS)[number])
        ? platform
        : undefined;
    const where = validPlatform
      ? { platform: validPlatform }
      : { platform: { in: [...SUPPORTED_PLATFORMS] } };

    const orders = await prisma.freelanceOrder.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        platform: true,
        budget: true,
        currency: true,
        status: true,
        url: true,
        createdAt: true,
        postedAt: true,
        clientName: true,
        filterScore: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
