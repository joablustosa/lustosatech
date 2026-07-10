import Link from "next/link";
import { Newspaper } from "lucide-react";

/** Cabeçalho público reutilizável (portal, produtos, artigo). */
export function SiteHeader({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-[#faf9f5]/85 backdrop-blur dark:border-white/10 dark:bg-[#191817]/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#141413] text-[#faf9f5] dark:bg-[#e8e6e1] dark:text-[#141413]">
            <Newspaper size={17} />
          </span>
          {brand}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="hidden hover:opacity-70 sm:inline">
            Notícias
          </Link>
          <Link href="/produtos" className="hidden hover:opacity-70 sm:inline">
            Produtos
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
  );
}
