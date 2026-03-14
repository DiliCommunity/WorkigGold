-- Запустить в Supabase SQL Editor после создания проекта
-- Создаёт таблицы Task и ProjectDeadline (если ещё нет полной схемы Prisma)

CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "source" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "Task_startAt_idx" ON "Task"("startAt");
CREATE INDEX IF NOT EXISTS "Task_done_idx" ON "Task"("done");

CREATE TABLE IF NOT EXISTS "ProjectDeadline" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectName" TEXT NOT NULL,
  "clientName" TEXT,
  "deadlineAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "ProjectDeadline_deadlineAt_idx" ON "ProjectDeadline"("deadlineAt");
CREATE INDEX IF NOT EXISTS "ProjectDeadline_completed_idx" ON "ProjectDeadline"("completed");
