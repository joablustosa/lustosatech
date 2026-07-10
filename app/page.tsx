import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { NewsPortal, PortalNews } from "@/components/news-portal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [companyName, news] = await Promise.all([
    getSetting("companyName"),
    prisma.news.findMany({
      where: { status: "published" },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 100,
    }),
  ]);

  const brand = companyName || "IA News";

  const items: PortalNews[] = news.map((n) => ({
    id: n.id,
    title: n.title,
    slug: n.slug,
    category: n.category,
    excerpt: n.excerpt,
    coverImageUrl: n.coverImageUrl,
    author: n.author,
    publishedAt: n.publishedAt.toISOString(),
    featured: n.featured,
  }));

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#141413] dark:bg-[#191817] dark:text-[#e8e6e1]">
      <SiteHeader brand={brand} />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-14 flex flex-col justify-between gap-4 border-b border-black/10 pb-10 dark:border-white/10 md:flex-row md:items-end">
          <h1 className="font-serif text-6xl font-bold leading-none tracking-tight sm:text-7xl">
            Notícias<br />de I.A.
          </h1>
          <p className="max-w-sm text-base text-black/60 dark:text-white/60 md:text-right">
            Novidades, tutoriais e tendências de Inteligência Artificial para
            produtividade, trabalho e negócios.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-black/10 py-20 text-center dark:border-white/10">
            <Newspaper className="opacity-40" size={40} />
            <p className="font-serif text-xl font-semibold">
              Nenhuma notícia publicada ainda
            </p>
            <p className="text-sm text-black/50 dark:text-white/50">
              Publique pelo painel em <code>/admin/news</code> ou via API com seus
              agentes.
            </p>
          </div>
        ) : (
          <NewsPortal news={items} />
        )}

        {/* ===== Produtos ===== */}
        <section className="mt-20 border-t border-black/10 pt-14 dark:border-white/10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-bold tracking-tight">
              Produtos
            </h2>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-70"
            >
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => (
              <Link
                key={p.slug}
                href={`/produtos/${p.slug}`}
                className="group rounded-2xl border border-black/10 p-6 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl font-bold">{p.name}</span>
                  <ArrowRight
                    size={18}
                    className="opacity-40 transition group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </div>
                <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                  {p.tagline}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter brand={brand} />
    </div>
  );
}
