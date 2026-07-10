import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uniqueSlug, hasValidApiKey } from "@/lib/news";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  slug: z.string().optional(),
  category: z.string().optional(),
  excerpt: z.string().min(1, "Resumo obrigatório"),
  content: z.string().min(1, "Conteúdo obrigatório"),
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

  const news = await prisma.news.findMany({
    where: {
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

  const slug = await uniqueSlug(d.slug || d.title);

  const news = await prisma.news.create({
    data: {
      title: d.title,
      slug,
      category: d.category || "Novidades",
      excerpt: d.excerpt,
      content: d.content,
      coverImageUrl: d.coverImageUrl || null,
      mediaType: d.mediaType || "image",
      mediaUrl: d.mediaUrl || null,
      author: d.author || null,
      source: d.source || null,
      sourceUrl: d.sourceUrl || null,
      tags: d.tags || null,
      featured: d.featured ?? false,
      status: d.status || "published",
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : new Date(),
    },
  });

  return NextResponse.json(news, { status: 201 });
}
