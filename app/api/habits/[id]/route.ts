import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHabits, saveHabits } from "@/lib/store";

async function auth() {
  return await getServerSession(authOptions);
}

// PATCH: toggle log for a date, or update name/emoji
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const updates = await req.json();
  const habits = await getHabits();
  const idx = habits.findIndex((h) => h.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (updates.toggleDate) {
    const date: string = updates.toggleDate;
    const logs = habits[idx].logs;
    const hasDate = logs.includes(date);
    habits[idx].logs = hasDate ? logs.filter((d) => d !== date) : [...logs, date];
  } else {
    habits[idx] = { ...habits[idx], ...updates };
  }

  await saveHabits(habits);
  return NextResponse.json({ habit: habits[idx] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const habits = await getHabits();
  await saveHabits(habits.filter((h) => h.id !== id));
  return NextResponse.json({ ok: true });
}
