import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { renderMarkdown } from "@/lib/markdown";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
function fmt(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

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
    <div className="min-h-screen bg-[#faf9f5] text-[#141413] dark:bg-[#191817] dark:text-[#e8e6e1]">
      <SiteHeader brand={brand} />

      <article className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-2 flex items-center gap-3 text-xs">
          <span className="font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
            {news.category}
          </span>
          <span className="text-black/40 dark:text-white/40">
            {fmt(news.publishedAt)}
          </span>
        </div>
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {news.title}
        </h1>
        <p className="mt-4 text-lg text-black/60 dark:text-white/60">
          {news.excerpt}
        </p>
        {(news.author || news.source) && (
          <p className="mt-3 text-sm text-black/50 dark:text-white/50">
            {news.author ? `Por ${news.author}` : ""}
            {news.author && news.source ? " · " : ""}
            {news.source &&
              (news.sourceUrl ? (
                <a
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70"
                >
                  {news.source}
                </a>
              ) : (
                news.source
              ))}
          </p>
        )}

        {news.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.coverImageUrl}
            alt={news.title}
            className="mt-8 w-full rounded-2xl object-cover"
          />
        )}

        {news.mediaType === "video" && news.mediaUrl && (
          <video src={news.mediaUrl} controls className="mt-8 w-full rounded-2xl" />
        )}

        <div
          className="article-body mt-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(news.content) }}
        />

        {tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-black/10 pt-6 dark:border-white/10">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/[0.06] px-3 py-1 text-xs text-black/60 dark:bg-white/10 dark:text-white/60"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>

      <SiteFooter brand={brand} />
    </div>
  );
}
