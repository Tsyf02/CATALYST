import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHabits, saveHabits } from "@/lib/store";
import type { Habit } from "@/lib/types";

async function auth() {
  return await getServerSession(authOptions);
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const habits = await getHabits();
  return NextResponse.json({ habits });
}

export async function POST(req: Request) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.name?.trim()) return NextResponse.json({ error: "Nama habit wajib diisi" }, { status: 400 });

  const habit: Habit = {
    id: "h" + Date.now() + Math.random().toString(36).slice(2, 6),
    name: String(body.name).trim(),
    emoji: body.emoji ?? "✅",
    logs: [],
    createdAt: new Date().toISOString(),
  };

  const habits = await getHabits();
  habits.push(habit);
  await saveHabits(habits);
  return NextResponse.json({ habit });
}
