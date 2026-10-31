import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEntries, saveEntries } from "@/lib/store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updates = await req.json();
  const entries = await getEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  entries[idx] = { ...entries[idx], ...updates, id: entries[idx].id };
  await saveEntries(entries);

  return NextResponse.json({ entry: entries[idx] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entries = await getEntries();
  const next = entries.filter((e) => e.id !== id);
  await saveEntries(next);

  return NextResponse.json({ ok: true });
}
