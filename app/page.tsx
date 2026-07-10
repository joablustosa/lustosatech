import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { NewsPortal, PortalNews } from "@/components/news-portal";

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
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#faf9f5]/85 backdrop-blur dark:border-white/10 dark:bg-[#191817]/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#141413] text-[#faf9f5] dark:bg-[#e8e6e1] dark:text-[#141413]">
              <Newspaper size={17} />
            </span>
            {brand}
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hidden hover:opacity-70 sm:inline">
              Notícias
            </Link>
            <Link href="/agendar" className="hidden hover:opacity-70 sm:inline">
              Agendar
            </Link>
            <Link
              href="/admin/login"
              className="rounded-full bg-[#141413] px-4 py-2 text-[#faf9f5] transition hover:opacity-90 dark:bg-[#e8e6e1] dark:text-[#141413]"
            >
              Painel
            </Link>
          </nav>
        </div>
      </header>

      {/* Título */}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-black/50 dark:text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} {brand}</span>
          <span>Portal de notícias de Inteligência Artificial</span>
        </div>
      </footer>
    </div>
  );
}
