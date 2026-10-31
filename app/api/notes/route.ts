import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotes, saveNotes } from "@/lib/store";
import type { Note } from "@/lib/types";

async function auth() {
  return await getServerSession(authOptions);
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notes = await getNotes();
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.title?.trim() && !body?.body?.trim())
    return NextResponse.json({ error: "Catatan tidak boleh kosong" }, { status: 400 });

  const now = new Date().toISOString();
  const note: Note = {
    id: "n" + Date.now() + Math.random().toString(36).slice(2, 6),
    title: String(body.title ?? "").trim(),
    body: String(body.body ?? "").trim(),
    color: body.color ?? "default",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };

  const notes = await getNotes();
  notes.unshift(note);
  await saveNotes(notes);
  return NextResponse.json({ note });
}
