import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.done !== undefined && { done: Boolean(body.done) }),
        ...(body.title && { title: String(body.title) }),
        ...(body.source !== undefined && { source: body.source ? String(body.source) : null }),
        ...(body.startAt && { startAt: new Date(body.startAt) }),
        ...(body.duration != null && { duration: Number(body.duration) }),
      },
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
