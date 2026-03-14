import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const deadlines = await prisma.projectDeadline.findMany({
      orderBy: { deadlineAt: "asc" },
    });
    return NextResponse.json(deadlines);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Ошибка загрузки дедлайнов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, clientName, deadlineAt, notes } = body;
    if (!projectName || !deadlineAt) {
      return NextResponse.json(
        { error: "Нужны: projectName, deadlineAt" },
        { status: 400 }
      );
    }
    const deadline = await prisma.projectDeadline.create({
      data: {
        projectName: String(projectName),
        clientName: clientName ? String(clientName) : null,
        deadlineAt: new Date(deadlineAt),
        notes: notes ? String(notes) : null,
      },
    });
    return NextResponse.json(deadline);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Ошибка создания дедлайна" },
      { status: 500 }
    );
  }
}
