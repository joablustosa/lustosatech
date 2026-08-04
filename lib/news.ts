import { prisma } from "./db";
import { slugify } from "./news-constants";
import { DEFAULT_TENANT_ID } from "./tenant";

export { NEWS_CATEGORIES, slugify } from "./news-constants";

/** Garante um slug único (por tenant) adicionando sufixo numérico se necessário. */
export async function uniqueSlug(
  tenantId: string,
  base: string,
  ignoreId?: string
): Promise<string> {
  const root = slugify(base) || "noticia";
  let slug = root;
  let i = 1;
  while (true) {
    const existing = await prisma.news.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${root}-${++i}`;
  }
}

/**
 * Verifica se a requisição tem a API key correta para agentes.
 * A key pode vir do header x-api-key ou do bearer token.
 * Configuração: Setting "newsApiKey" do tenant padrão ou env NEWS_API_KEY.
 */
export async function hasValidApiKey(req: Request): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { tenantId_key: { tenantId: DEFAULT_TENANT_ID, key: "newsApiKey" } },
  });
  const expected = setting?.value || process.env.NEWS_API_KEY;
  if (!expected) return false;

  const headerKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerKey === expected;
}
