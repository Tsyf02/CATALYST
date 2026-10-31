import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTasks, saveTasks } from "@/lib/store";

async function auth() {
  return await getServerSession(authOptions);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const updates = await req.json();
  const tasks = await getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  tasks[idx] = { ...tasks[idx], ...updates };
  await saveTasks(tasks);
  return NextResponse.json({ task: tasks[idx] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tasks = await getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await saveTasks(filtered);
  return NextResponse.json({ ok: true });
}
