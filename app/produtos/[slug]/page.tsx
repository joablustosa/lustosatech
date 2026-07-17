import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Sparkles,
  Check,
  Code2,
  Rocket,
  ShieldCheck,
  Wallet,
  RefreshCw,
  Search,
  Megaphone,
  CalendarClock,
  Bot,
  Share2,
} from "lucide-react";
import { getSetting } from "@/lib/settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LeadButton } from "@/components/lead-button";
import { getProduct, type Highlight } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Produto não encontrado" };
  const title = `${product.name} — ${product.tagline}`;
  const images = [
    product.logo || "/og.png",
    ...product.platforms.map((p) => p.logo).filter(Boolean),
    "/og.png",
  ].filter((url, i, arr): url is string => Boolean(url) && arr.indexOf(url) === i);
  return {
    title,
    description: product.description,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title,
      description: product.description,
      url: `/produtos/${product.slug}`,
      siteName: "Lustosa Tech",
      images: images.map((url) => ({ url, alt: product.name })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.description,
      images: [product.logo || "/og.png"],
    },
  };
}

const HIGHLIGHT_ICON: Record<Highlight["icon"], React.ElementType> = {
  code: Code2,
  rocket: Rocket,
  shield: ShieldCheck,
  wallet: Wallet,
  refresh: RefreshCw,
  search: Search,
  megaphone: Megaphone,
  calendar: CalendarClock,
  bot: Bot,
  share: Share2,
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const brand = (await getSetting("companyName")) || "Lustosa Tech";
  const wa = product.whatsapp;
  const platformCols =
    product.platforms.length > 4
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#141413] dark:bg-[#191817] dark:text-[#e8e6e1]">
      <SiteHeader brand={brand} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(900px 400px at 50% -10%, rgba(58,93,168,0.24), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          {product.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.logo}
              alt={product.name}
              className="mx-auto mb-6 h-20 w-20 object-contain"
            />
          )}
          {product.badge && (
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent">
              <Sparkles size={15} /> {product.badge}
            </div>
          )}
          <p className="font-serif text-sm font-semibold uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
            {product.name}
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            {product.tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-black/65 dark:text-white/65">
            {product.description}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <LeadButton
              label="Agendar reunião"
              whatsapp={wa}
              productName={product.name}
              planOptions={product.plans.map((p) => p.name)}
              variant="primary"
            />
            <LeadButton
              label="Saber mais"
              whatsapp={wa}
              productName={product.name}
              planOptions={product.plans.map((p) => p.name)}
              variant="outline"
            />
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.highlights.map((h) => {
            const Icon = HIGHLIGHT_ICON[h.icon];
            return (
              <div
                key={h.title}
                className="rounded-2xl border border-black/10 p-6 transition hover:border-accent/40 dark:border-white/10 dark:hover:border-accent/40"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold">{h.title}</h3>
                <p className="mt-1.5 text-sm text-black/60 dark:text-white/60">
                  {h.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Planos */}
      <section
        id="planos"
        className="border-y border-black/10 bg-black/[0.02] py-20 dark:border-white/10 dark:bg-white/[0.02]"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-4xl font-bold tracking-tight">Planos</h2>
            <p className="mt-3 text-black/60 dark:text-white/60">
              {product.plansNote ||
                "Escopo e preço fechados no diagnóstico. Sem surpresa no boleto."}
            </p>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-3">
            {product.plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex h-full flex-col rounded-3xl border p-7 ${
                  plan.highlight
                    ? "border-[#3a5da8] bg-[#faf9f5] shadow-xl ring-1 ring-[#3a5da8]/30 dark:bg-[#20242e]"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                {plan.highlight && (
                  <span className="mb-3 w-fit rounded-full bg-[#3a5da8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Mais escolhido
                  </span>
                )}
                <h3 className="font-serif text-2xl font-bold">{plan.name}</h3>
                <p className="mt-3 text-sm text-black/50 dark:text-white/50">
                  {plan.deadline}
                </p>
                <p className="mt-4 text-sm font-medium text-black/70 dark:text-white/70">
                  {plan.tagline}
                </p>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {plan.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-sm">
                      <Check
                        size={17}
                        className="mt-0.5 shrink-0 text-[#3a5da8] dark:text-[#9bb9e3]"
                      />
                      <span className="text-black/70 dark:text-white/70">{it}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <LeadButton
                    label="Falar no WhatsApp"
                    whatsapp={wa}
                    productName={product.name}
                    planOptions={product.plans.map((p) => p.name)}
                    defaultPlan={plan.name}
                    variant={plan.highlight ? "primary" : "outline"}
                    fullWidth
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center font-serif text-4xl font-bold tracking-tight">
          Como funciona
        </h2>
        <ol className="space-y-6">
          {product.steps.map((step, i) => (
            <li key={step.title} className="flex gap-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent font-serif text-lg font-bold text-accent-contrast shadow-sm shadow-brand-600/20">
                {i + 1}
              </span>
              <div className="pt-1">
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="mt-1 text-black/65 dark:text-white/65">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Plataformas / Redes */}
      <section className="border-t border-black/10 py-20 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-4xl font-bold tracking-tight">
              {product.platformsTitle || "Você escolhe a plataforma"}
            </h2>
            <p className="mt-3 text-black/60 dark:text-white/60">
              {product.platformsSubtitle ||
                "Construímos na ferramenta que faz mais sentido para o seu projeto."}
            </p>
          </div>
          <div className={`grid gap-5 ${platformCols}`}>
            {product.platforms.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-black/10 p-6 text-center dark:border-white/10"
              >
                <div
                  className="mx-auto mb-4 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl"
                  style={{
                    backgroundColor: p.logo ? "#000" : `${p.color}22`,
                    color: p.color,
                  }}
                >
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo}
                      alt={p.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="font-serif text-2xl font-bold">
                      {p.name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl font-bold">{p.name}</h3>
                <p className="mt-1.5 text-sm text-black/60 dark:text-white/60">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nota de fechamento + CTA final */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
          {product.closingNote && (
            <p className="mx-auto mb-6 max-w-2xl text-lg text-black/70 dark:text-white/70">
              {product.closingNote}
            </p>
          )}
          <h3 className="font-serif text-3xl font-bold">
            {product.closingHeadline || "Bora tirar seu sistema do papel?"}
          </h3>
          <p className="mt-2 text-black/60 dark:text-white/60">
            {product.closingSubline ||
              "Comece pelo diagnóstico — 1h, sem compromisso, com preço fechado ao final."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <LeadButton
              label="Agendar diagnóstico"
              whatsapp={wa}
              productName={product.name}
              planOptions={product.plans.map((p) => p.name)}
              variant="primary"
            />
            <Link
              href="/produtos"
              className="inline-flex items-center rounded-full border border-black/20 px-6 py-3 text-base font-medium transition hover:border-black/50 dark:border-white/20 dark:hover:border-white/50"
            >
              Ver todos os produtos
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter brand={brand} />
    </div>
  );
}
