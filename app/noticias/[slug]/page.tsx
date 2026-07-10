import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Newspaper } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const news = await prisma.news.findUnique({ where: { slug } });
  if (!news) return { title: "Notícia não encontrada" };
  return {
    title: news.title,
    description: news.excerpt,
    openGraph: {
      title: news.title,
      description: news.excerpt,
      images: news.coverImageUrl ? [news.coverImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [news, companyName] = await Promise.all([
    prisma.news.findUnique({ where: { slug } }),
    getSetting("companyName"),
  ]);

  if (!news || news.status !== "published") notFound();

  const brand = companyName || "IA News";
  const tags = news.tags
    ? news.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen">
      <header className="border-b [border-color:var(--border)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              <Newspaper size={18} />
            </span>
            {brand}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm muted hover:underline"
          >
            <ArrowLeft size={15} /> Todas as notícias
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {news.category}
        </span>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
          {news.title}
        </h1>
        <p className="mt-4 text-sm muted">
          {news.author ? `Por ${news.author} · ` : ""}
          {formatDate(news.publishedAt)}
          {news.source && (
            <>
              {" · "}
              {news.sourceUrl ? (
                <a
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {news.source}
                </a>
              ) : (
                news.source
              )}
            </>
          )}
        </p>

        {news.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.coverImageUrl}
            alt={news.title}
            className="mt-8 w-full rounded-2xl object-cover"
          />
        )}

        {news.mediaType === "video" && news.mediaUrl && (
          <video
            src={news.mediaUrl}
            controls
            className="mt-8 w-full rounded-2xl"
          />
        )}

        <div
          className="article-body mt-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(news.content) }}
        />

        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t pt-6 [border-color:var(--border)]">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/5 px-3 py-1 text-xs muted dark:bg-white/10"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
