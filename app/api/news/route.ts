import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uniqueSlug, hasValidApiKey } from "@/lib/news";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
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

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: requiredText("Título obrigatório"),
  slug: optionalText,
  category: optionalText,
  excerpt: requiredText("Resumo obrigatório"),
  content: requiredText("Conteúdo obrigatório"),
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

/** Lista notícias. Público vê apenas publicadas. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const category = p.get("category") || undefined;
  const q = p.get("q") || undefined;
  const slug = p.get("slug") || undefined;
  const limit = Math.min(Number(p.get("limit")) || 50, 100);

  const session = await auth();
  const isAdmin = !!session?.user;
  const wantAll = p.get("all") === "1" && isAdmin;
  // Logado vê as notícias do próprio tenant; público vê o tenant padrão.
  const tenantId = session?.user?.tenantId || DEFAULT_TENANT_ID;

  const news = await prisma.news.findMany({
    where: {
      tenantId,
      ...(wantAll ? {} : { status: "published" }),
      ...(category ? { category } : {}),
      ...(slug ? { slug } : {}),
      ...(q
        ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json(news);
}

/** Cria uma notícia. Requer sessão de admin OU header x-api-key (agentes). */
export async function POST(req: NextRequest) {
  const session = await auth();
  const authorized = !!session?.user || (await hasValidApiKey(req));
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message, issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Sessão usa o tenant do usuário; agente via x-api-key publica no tenant padrão.
  const tenantId = session?.user?.tenantId || DEFAULT_TENANT_ID;
  const slug = await uniqueSlug(tenantId, d.slug || d.title);

  const news = await prisma.news.create({
    data: {
      tenantId,
      title: d.title,
      slug,
      category: d.category ?? "Novidades",
      excerpt: d.excerpt,
      content: d.content,
      coverImageUrl: d.coverImageUrl ?? null,
      mediaType: d.mediaType ?? "image",
      mediaUrl: d.mediaUrl ?? null,
      author: d.author ?? null,
      source: d.source ?? null,
      sourceUrl: d.sourceUrl ?? null,
      tags: d.tags ?? null,
      featured: d.featured ?? false,
      status: d.status ?? "published",
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : new Date(),
    },
  });

  return NextResponse.json(news, { status: 201 });
}
