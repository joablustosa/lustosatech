import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { uniqueSlug } from "@/lib/news";
import {
  MEDIA_TYPES,
  NEWS_STATUS,
  optionalBool,
  optionalDate,
  optionalEnum,
  optionalText,
  optionalUrl,
  requiredText,
} from "@/lib/news-schema";

const patchSchema = z.object({
  title: requiredText("Título obrigatório").optional(),
  slug: optionalText,
  category: optionalText,
  excerpt: requiredText("Resumo obrigatório").optional(),
  content: requiredText("Conteúdo obrigatório").optional(),
  coverImageUrl: optionalUrl,
  mediaType: optionalEnum(MEDIA_TYPES),
  mediaUrl: optionalUrl,
  author: optionalText,
  source: optionalText,
  sourceUrl: optionalUrl,
  tags: optionalText,
  featured: optionalBool,
  status: optionalEnum(NEWS_STATUS),
  publishedAt: optionalDate,
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

  // Monta o update explicitamente: `undefined` = campo não enviado (não altera),
  // `null` = usuário limpou o campo (grava null). Colunas NOT NULL nunca
  // recebem null — para elas, null é tratado como "não informado".
  const data: Record<string, unknown> = {};

  // obrigatórias no banco (NOT NULL)
  if (d.title !== undefined) data.title = d.title;
  if (d.excerpt !== undefined) data.excerpt = d.excerpt;
  if (d.content !== undefined) data.content = d.content;
  if (d.category != null) data.category = d.category;
  if (d.mediaType !== undefined) data.mediaType = d.mediaType;
  if (d.status !== undefined) data.status = d.status;
  if (d.featured !== undefined) data.featured = d.featured;
  if (d.publishedAt != null) data.publishedAt = new Date(d.publishedAt);

  // opcionais (nuláveis): null limpa o campo
  if (d.coverImageUrl !== undefined) data.coverImageUrl = d.coverImageUrl;
  if (d.mediaUrl !== undefined) data.mediaUrl = d.mediaUrl;
  if (d.author !== undefined) data.author = d.author;
  if (d.source !== undefined) data.source = d.source;
  if (d.sourceUrl !== undefined) data.sourceUrl = d.sourceUrl;
  if (d.tags !== undefined) data.tags = d.tags;

  if (d.slug || d.title) {
    data.slug = await uniqueSlug(d.slug || d.title!, id);
  }

  const news = await prisma.news.update({ where: { id }, data });
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
