import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEntries, saveEntries, storageIsPersistent } from "@/lib/store";
import type { Entry } from "@/lib/types";

async function requireSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await getEntries();
  return NextResponse.json({ entries, storageIsPersistent });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body?.title || !body?.deadline) {
    return NextResponse.json({ error: "title dan deadline wajib diisi" }, { status: 400 });
  }

  const entry: Entry = {
    id: "e" + Date.now() + Math.random().toString(36).slice(2, 7),
    title: String(body.title).trim(),
    cat: body.cat ?? "lainnya",
    deadline: body.deadline,
    remind: Number(body.remind ?? 60),
    desc: String(body.desc ?? "").trim(),
    photo: body.photo ?? null,
    audio: body.audio ?? null,
    done: false,
    createdAt: new Date().toISOString(),
  };

  const entries = await getEntries();
  entries.push(entry);
  await saveEntries(entries);

  return NextResponse.json({ entry });
}
