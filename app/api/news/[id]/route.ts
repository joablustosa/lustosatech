import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { uniqueSlug } from "@/lib/news";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  category: z.string().optional(),
  excerpt: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  mediaType: z.enum(["image", "video"]).optional(),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  author: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  tags: z.string().optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  return NextResponse.json(news);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const data: Record<string, unknown> = { ...d };
  if (d.slug || d.title) {
    data.slug = await uniqueSlug(d.slug || d.title!, id);
  }
  if (d.publishedAt) data.publishedAt = new Date(d.publishedAt);
  // normaliza strings vazias em null nos campos opcionais
  for (const k of ["coverImageUrl", "mediaUrl", "sourceUrl", "author", "source", "tags"]) {
    if (data[k] === "") data[k] = null;
  }

  const news = await prisma.news.update({
    where: { id },
    data: data as any,
  });
  return NextResponse.json(news);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.news.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
