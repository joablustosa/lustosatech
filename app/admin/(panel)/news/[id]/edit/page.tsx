import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NewsForm, NewsData } from "@/components/news-form";

export const dynamic = "force-dynamic";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const news = await prisma.news.findFirst({
    where: { id, tenantId: session!.user.tenantId },
  });
  if (!news) notFound();

  const initial: NewsData = {
    id: news.id,
    title: news.title,
    category: news.category,
    excerpt: news.excerpt,
    content: news.content,
    coverImageUrl: news.coverImageUrl,
    mediaType: news.mediaType,
    mediaUrl: news.mediaUrl,
    author: news.author,
    source: news.source,
    sourceUrl: news.sourceUrl,
    tags: news.tags,
    featured: news.featured,
    status: news.status,
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/news"
        className="inline-flex items-center gap-1 text-sm muted hover:underline"
      >
        <ArrowLeft size={15} /> Voltar
      </Link>
      <h1 className="text-2xl font-bold">Editar notícia</h1>
      <NewsForm initial={initial} />
    </div>
  );
}
