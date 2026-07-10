"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export interface PortalNews {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  coverImageUrl: string | null;
  author: string | null;
  publishedAt: string;
  featured: boolean;
}

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function NewsPortal({ news }: { news: PortalNews[] }) {
  const [query, setQuery] = useState("");

  const featured = news[0];
  const highlights = news.slice(0, 4);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return news;
    return news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q)
    );
  }, [news, query]);

  return (
    <div>
      {/* ===== Destaque ===== */}
      {featured && (
        <section className="grid gap-10 border-b border-black/10 pb-14 dark:border-white/10 md:grid-cols-2 md:items-start">
          <Link href={`/noticias/${featured.slug}`} className="group block">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-black/5 dark:bg-white/[0.06]">
              {featured.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <span className="font-serif text-2xl opacity-40">
                    {featured.title}
                  </span>
                </div>
              )}
            </div>
          </Link>

          <div className="divide-y divide-black/10 dark:divide-white/10">
            {highlights.map((n) => (
              <Link
                key={n.id}
                href={`/noticias/${n.slug}`}
                className="group block py-5 first:pt-0"
              >
                <div className="mb-1.5 flex items-center gap-3 text-xs">
                  <span className="font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
                    {n.category}
                  </span>
                  <span className="text-black/40 dark:text-white/40">
                    {shortDate(n.publishedAt)}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight group-hover:underline">
                  {n.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                  {n.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Lista completa (tabela) ===== */}
      <section className="mt-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-3xl font-bold tracking-tight">Notícias</h2>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="w-64 rounded-full border border-black/15 bg-transparent py-2 pl-9 pr-4 text-sm outline-none transition focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
            />
          </div>
        </div>

        {/* Cabeçalho da tabela */}
        <div className="hidden grid-cols-[130px_180px_1fr] gap-4 border-b border-black/15 pb-3 text-xs font-semibold uppercase tracking-wide text-black/50 dark:border-white/15 dark:text-white/50 sm:grid">
          <span>Data</span>
          <span>Categoria</span>
          <span>Título</span>
        </div>

        {filtered.length === 0 ? (
          <p className="py-14 text-center text-sm text-black/50 dark:text-white/50">
            Nenhuma notícia encontrada.
          </p>
        ) : (
          <ul>
            {filtered.map((n) => (
              <li
                key={n.id}
                className="border-b border-black/10 dark:border-white/10"
              >
                <Link
                  href={`/noticias/${n.slug}`}
                  className="group grid gap-1 py-5 sm:grid-cols-[130px_180px_1fr] sm:items-baseline sm:gap-4"
                >
                  <span className="text-sm text-black/50 dark:text-white/50">
                    {shortDate(n.publishedAt)}
                  </span>
                  <span className="text-sm text-black/60 dark:text-white/60">
                    {n.category}
                  </span>
                  <span className="font-serif text-lg font-medium leading-snug tracking-tight group-hover:underline">
                    {n.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
