import Link from "next/link";
import { CalendarCheck } from "lucide-react";

/** Cabeçalho público reutilizável (portal, produtos, artigo). */
export function SiteHeader({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-[#faf9f5]/85 backdrop-blur dark:border-white/10 dark:bg-[#191817]/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={brand} className="h-9 w-9 object-contain" />
          {brand}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link
            href="/"
            className="hidden transition-colors hover:text-accent sm:inline"
          >
            Notícias
          </Link>
          <Link
            href="/produtos"
            className="hidden transition-colors hover:text-accent sm:inline"
          >
            Produtos
          </Link>
          <Link
            href="/cases"
            className="hidden transition-colors hover:text-accent sm:inline"
          >
            Cases
          </Link>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-accent-contrast shadow-sm shadow-brand-600/20 transition hover:bg-accent-hover"
          >
            <CalendarCheck size={15} /> Agendar reunião
          </Link>
        </nav>
      </div>
    </header>
  );
}
