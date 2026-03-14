import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { startAt: "asc" },
    });
    return NextResponse.json(tasks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка загрузки задач" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, source, startAt, duration } = body;
    if (!title || !startAt || duration == null) {
      return NextResponse.json(
        { error: "Нужны: title, startAt, duration" },
        { status: 400 }
      );
    }
    const task = await prisma.task.create({
      data: {
        title: String(title),
        source: source ? String(source) : null,
        startAt: new Date(startAt),
        duration: Number(duration),
      },
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка создания задачи" }, { status: 500 });
  }
}
