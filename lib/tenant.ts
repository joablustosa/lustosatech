import { prisma } from "./db";

/**
 * Tenant padrão: dono do conteúdo público do site (portal de notícias,
 * agendamento, WhatsApp). Criado pela migration/seed com id fixo.
 */
export const DEFAULT_TENANT_ID = "tenant_default";

/** Garante que o tenant padrão existe e retorna o id dele. */
export async function getDefaultTenantId(): Promise<string> {
  const found = await prisma.tenant.findUnique({
    where: { id: DEFAULT_TENANT_ID },
    select: { id: true },
  });
  if (found) return found.id;
  const created = await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {},
    create: { id: DEFAULT_TENANT_ID, name: "Lustosa Tech", slug: "lustosa-tech" },
  });
  return created.id;
}

/** Gera um slug único de tenant a partir do nome da empresa. */
export async function uniqueTenantSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "empresa";
  let slug = base;
  let i = 2;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}
