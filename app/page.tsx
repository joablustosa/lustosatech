import Link from "next/link";
import { Newspaper, CalendarCheck } from "lucide-react";
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
      take: 60,
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-[var(--bg)]/80 backdrop-blur [border-color:var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              <Newspaper size={18} />
            </span>
            {brand}
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/agendar" className="btn-ghost">
              <CalendarCheck size={16} /> Agendar
            </Link>
            <Link href="/admin/login" className="btn-outline">
              Painel
            </Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Notícias de I.A.
          </h1>
          <p className="mt-3 max-w-2xl text-lg muted">
            As últimas novidades, pesquisas e lançamentos em inteligência
            artificial.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="card grid place-items-center gap-3 p-16 text-center">
            <Newspaper className="muted" size={40} />
            <p className="text-lg font-semibold">Nenhuma notícia publicada ainda</p>
            <p className="text-sm muted">
              Publique pelo painel em <code>/admin/news</code> ou via API com seus
              agentes.
            </p>
          </div>
        ) : (
          <NewsPortal news={items} />
        )}
      </main>

      <footer className="border-t py-10 text-center text-sm muted [border-color:var(--border)]">
        {brand} · Portal de notícias de Inteligência Artificial
      </footer>
    </div>
  );
}
