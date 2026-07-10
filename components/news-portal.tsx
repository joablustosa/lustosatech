"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

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

export function NewsPortal({ news }: { news: PortalNews[] }) {
  const [active, setActive] = useState("Todos");

  const categories = useMemo(() => {
    const set = new Set(news.map((n) => n.category));
    return ["Todos", ...Array.from(set)];
  }, [news]);

  const featured = useMemo(
    () => news.find((n) => n.featured) || news[0],
    [news]
  );

  const list = useMemo(() => {
    const rest = news.filter((n) => n.id !== featured?.id);
    return active === "Todos"
      ? rest
      : rest.filter((n) => n.category === active);
  }, [news, active, featured]);

  return (
    <div>
      {/* Destaque */}
      {featured && (
        <Link href={`/noticias/${featured.slug}`} className="group block">
          <article className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5">
              {featured.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                {featured.category}
              </span>
              <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-base muted">
                {featured.excerpt}
              </p>
              <p className="mt-4 text-sm muted">
                {featured.author ? `${featured.author} · ` : ""}
                {formatDate(featured.publishedAt)}
              </p>
            </div>
          </article>
        </Link>
      )}

      {/* Filtro de categorias */}
      <div className="mt-14 flex flex-wrap gap-2 border-b pb-4 [border-color:var(--border)]">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active === c
                ? "bg-brand-600 text-white"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <p className="py-16 text-center text-sm muted">
          Nenhuma notícia nesta categoria ainda.
        </p>
      ) : (
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((n) => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="group block">
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                {n.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <span className="mt-4 block text-xs font-semibold uppercase tracking-wider text-brand-600">
                {n.category}
              </span>
              <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight group-hover:underline">
                {n.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm muted">{n.excerpt}</p>
              <p className="mt-3 text-xs muted">{formatDate(n.publishedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
