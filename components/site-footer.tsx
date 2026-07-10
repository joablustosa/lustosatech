import Link from "next/link";

/** Rodapé público reutilizável. O acesso ao painel fica aqui como "Administração". */
export function SiteFooter({ brand }: { brand: string }) {
  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-black/50 dark:text-white/50 sm:flex-row">
        <span>
          © {new Date().getFullYear()} {brand} · Portal de notícias e produtos de
          I.A.
        </span>
        <Link
          href="/admin/login"
          className="hover:text-black/80 hover:underline dark:hover:text-white/80"
        >
          Administração
        </Link>
      </div>
    </footer>
  );
}
