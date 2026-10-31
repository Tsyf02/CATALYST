import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPages, savePages } from "@/lib/store";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pages = await getPages();
  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const pages = await getPages();

  // Auto-assign page number if not given
  const maxPage = pages.reduce((m, p) => Math.max(m, p.pageNumber), 0);

  const page = {
    id: randomUUID(),
    pageNumber: body.pageNumber ?? maxPage + 1,
    title: body.title ?? "",
    body: body.body ?? "",
    color: body.color ?? "default",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pages.push(page);
  await savePages(pages);
  return NextResponse.json({ page }, { status: 201 });
}
