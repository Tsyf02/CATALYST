import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotes, saveNotes } from "@/lib/store";

async function auth() {
  return await getServerSession(authOptions);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const updates = await req.json();
  const notes = await getNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  notes[idx] = { ...notes[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveNotes(notes);
  return NextResponse.json({ note: notes[idx] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const notes = await getNotes();
  await saveNotes(notes.filter((n) => n.id !== id));
  return NextResponse.json({ ok: true });
}
