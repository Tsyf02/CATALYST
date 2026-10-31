import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPages, savePages } from "@/lib/store";

async function auth() {
  return await getServerSession(authOptions);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const updates = await req.json();
  const pages = await getPages();
  const idx = pages.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  pages[idx] = { ...pages[idx], ...updates, id: pages[idx].id, updatedAt: new Date().toISOString() };
  await savePages(pages);
  return NextResponse.json({ page: pages[idx] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const pages = await getPages();
  await savePages(pages.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
