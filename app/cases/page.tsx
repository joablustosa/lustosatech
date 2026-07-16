import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getSetting } from "@/lib/settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CASES } from "@/lib/cases";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cases de Sucesso",
  description:
    "Cases de sucesso da Lustosa Tech: portais, plataformas e agentes de IA em produção para diferentes setores.",
  alternates: { canonical: "/cases" },
  openGraph: {
    title: "Cases de Sucesso | Lustosa Tech",
    description:
      "Portais, plataformas e agentes de IA em produção construídos pela Lustosa Tech.",
    url: "/cases",
    images: [{ url: "/og.png", width: 1920, height: 1024, alt: "Lustosa Tech" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cases de Sucesso | Lustosa Tech",
    images: ["/og.png"],
  },
};

export default async function CasesPage() {
  const brand = (await getSetting("companyName")) || "Lustosa Tech";

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#141413] dark:bg-[#191817] dark:text-[#e8e6e1]">
      <SiteHeader brand={brand} />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-14 border-b border-black/10 pb-10 dark:border-white/10">
          <h1 className="font-serif text-6xl font-bold leading-none tracking-tight sm:text-7xl">
            Cases de sucesso
          </h1>
          <p className="mt-4 max-w-xl text-base text-black/60 dark:text-white/60">
            Portais, plataformas e agentes de IA que a {brand} colocou em
            produção — no ar, gerando resultado de verdade.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {CASES.map((c) => (
            <a
              key={c.slug}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-black/10 p-8 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
            >
              <div className="mb-5 flex items-center justify-between">
                <span
                  className="grid h-14 w-14 place-items-center rounded-2xl font-serif text-2xl font-bold"
                  style={{ backgroundColor: `${c.color}1a`, color: c.color }}
                >
                  {c.name.slice(0, 1)}
                </span>
                <ArrowUpRight
                  size={20}
                  className="opacity-40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </div>

              <span className="w-fit rounded-full border border-black/15 px-3 py-1 text-xs font-medium text-black/60 dark:border-white/15 dark:text-white/60">
                {c.sector}
              </span>
              <h2 className="mt-4 font-serif text-3xl font-bold">{c.name}</h2>
              <p className="mt-2 text-lg text-black/70 dark:text-white/70">
                {c.tagline}
              </p>
              <p className="mt-3 text-sm text-black/60 dark:text-white/60">
                {c.description}
              </p>

              <ul className="mt-6 space-y-2.5">
                {c.results.map((r) => (
                  <li key={r} className="flex gap-2.5 text-sm">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-black/70 dark:text-white/70">{r}</span>
                  </li>
                ))}
              </ul>

              <span className="mt-7 inline-flex items-center gap-1 text-sm font-medium">
                Visitar o site
                <ArrowUpRight
                  size={16}
                  className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </a>
          ))}
        </div>
      </main>

      <SiteFooter brand={brand} />
    </div>
  );
}
