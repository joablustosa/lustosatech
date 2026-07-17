import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getSetting } from "@/lib/settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos de I.A. e Soluções Tech",
  description:
    "Produtos de Inteligência Artificial e soluções tech da Lustosa Tech: desenvolvimento sob medida, automação e sistemas em produção.",
  alternates: { canonical: "/produtos" },
  openGraph: {
    title: "Produtos de I.A. e Soluções Tech | Lustosa Tech",
    description:
      "Produtos de Inteligência Artificial e soluções tech da Lustosa Tech.",
    url: "/produtos",
    images: [{ url: "/og.png", width: 1920, height: 1024, alt: "Lustosa Tech" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Produtos de I.A. e Soluções Tech | Lustosa Tech",
    images: ["/og.png"],
  },
};

export default async function ProdutosPage() {
  const brand = (await getSetting("companyName")) || "Lustosa Tech";

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#141413] dark:bg-[#191817] dark:text-[#e8e6e1]">
      <SiteHeader brand={brand} />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-14 border-b border-black/10 pb-10 dark:border-white/10">
          <h1 className="font-serif text-6xl font-bold leading-none tracking-tight sm:text-7xl">
            Produtos
          </h1>
          <p className="mt-4 max-w-xl text-base text-black/60 dark:text-white/60">
            Soluções de Inteligência Artificial da {brand} para automatizar
            atendimento, vendas e produtividade.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/produtos/${p.slug}`}
              className="group flex flex-col rounded-2xl border border-black/10 p-8 transition hover:border-accent/50 hover:shadow-lg hover:shadow-brand-600/5 dark:border-white/10 dark:hover:border-accent/50"
            >
              {p.badge && (
                <span className="mb-4 w-fit rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                  {p.badge}
                </span>
              )}
              <h2 className="font-serif text-3xl font-bold transition-colors group-hover:text-accent">
                {p.name}
              </h2>
              <p className="mt-2 text-lg text-black/70 dark:text-white/70">
                {p.tagline}
              </p>
              <p className="mt-3 line-clamp-3 text-sm text-black/60 dark:text-white/60">
                {p.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Conhecer
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter brand={brand} />
    </div>
  );
}
