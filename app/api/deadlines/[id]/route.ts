import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deadline = await prisma.projectDeadline.update({
      where: { id },
      data: {
        ...(body.projectName && { projectName: String(body.projectName) }),
        ...(body.clientName !== undefined && {
          clientName: body.clientName ? String(body.clientName) : null,
        }),
        ...(body.deadlineAt && { deadlineAt: new Date(body.deadlineAt) }),
        ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
        ...(body.completed !== undefined && { completed: Boolean(body.completed) }),
      },
    });
    return NextResponse.json(deadline);
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
    await prisma.projectDeadline.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
