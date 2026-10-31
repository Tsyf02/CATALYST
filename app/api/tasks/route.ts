import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTasks, saveTasks } from "@/lib/store";
import type { Task } from "@/lib/types";

async function auth() {
  return await getServerSession(authOptions);
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await getTasks();
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.title?.trim()) return NextResponse.json({ error: "title wajib diisi" }, { status: 400 });

  const task: Task = {
    id: "t" + Date.now() + Math.random().toString(36).slice(2, 6),
    title: String(body.title).trim(),
    priority: body.priority ?? "sedang",
    cat: body.cat ?? "lainnya",
    dueDate: body.dueDate ?? null,
    done: false,
    createdAt: new Date().toISOString(),
  };

  const tasks = await getTasks();
  tasks.unshift(task);
  await saveTasks(tasks);
  return NextResponse.json({ task });
}
