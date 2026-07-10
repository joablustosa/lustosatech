import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { getSetting } from "@/lib/settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Produto não encontrado" };
  return { title: product.name, description: product.tagline };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const brand = (await getSetting("companyName")) || "Lustosa Tech";

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#141413] dark:bg-[#191817] dark:text-[#e8e6e1]">
      <SiteHeader brand={brand} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(900px 380px at 50% -10%, rgba(16,185,129,0.18), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          {product.badge && (
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300">
              <Sparkles size={15} /> {product.badge}
            </div>
          )}
          <p className="font-serif text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            {product.name}
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            {product.tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-black/65 dark:text-white/65">
            {product.description}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={product.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-base font-medium text-white transition hover:bg-brand-700"
            >
              {product.primaryCta.label} <ArrowRight size={18} />
            </Link>
            {product.secondaryCta && (
              <Link
                href={product.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-base font-medium transition hover:border-black/40 dark:border-white/15 dark:hover:border-white/40"
              >
                {product.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-10 text-center font-serif text-3xl font-bold tracking-tight">
          O que a {product.name} faz
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {product.features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-black/10 p-6 dark:border-white/10"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
                <Check size={18} />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-black/60 dark:text-white/60">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-black/10 bg-black/[0.02] p-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <h3 className="font-serif text-2xl font-bold">
            Pronto para automatizar seu atendimento?
          </h3>
          <Link
            href={product.primaryCta.href}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
          >
            {product.primaryCta.label} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <SiteFooter brand={brand} />
    </div>
  );
}
