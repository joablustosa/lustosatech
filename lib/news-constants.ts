// Constantes e utilidades puras de notícias — seguras para client e server
// (não importa Prisma nem nada server-only).

export const NEWS_CATEGORIES = [
  "Novidades",
  "Pesquisa",
  "Produto",
  "Política",
  "Opinião",
  "Mercado",
] as const;

/** Gera um slug amigável a partir de um texto. */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
