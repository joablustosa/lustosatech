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
          <Link href="/" className="hidden hover:opacity-70 sm:inline">
            Notícias
          </Link>
          <Link href="/produtos" className="hidden hover:opacity-70 sm:inline">
            Produtos
          </Link>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#141413] px-5 py-2 text-[#faf9f5] transition hover:opacity-90 dark:bg-[#e8e6e1] dark:text-[#141413]"
          >
            <CalendarCheck size={15} /> Agendar reunião
          </Link>
        </nav>
      </div>
    </header>
  );
}
