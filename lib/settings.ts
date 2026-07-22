import { prisma } from "./db";

/**
 * Chaves de configuração conhecidas. Cada uma pode vir do banco (tela de
 * Settings) ou de uma variável de ambiente (fallback). O banco tem prioridade.
 */
export const SETTING_ENV_FALLBACK: Record<string, string | undefined> = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  newsApiKey: process.env.NEWS_API_KEY,
};

export const SECRET_KEYS = new Set([
  "openaiApiKey",
  "whatsappAccessToken",
  "whatsappVerifyToken",
  "newsApiKey",
]);

export type SettingKey =
  | "companyName"
  | "aiPersona"
  | "openaiApiKey"
  | "whatsappAccessToken"
  | "whatsappPhoneNumberId"
  | "whatsappVerifyToken"
  | "whatsappBusinessAccountId"
  | "bookingBaseUrl"
  | "newsApiKey";

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  // aplica fallback de env quando não houver valor no banco
  for (const [key, envValue] of Object.entries(SETTING_ENV_FALLBACK)) {
    if (!map[key] && envValue) map[key] = envValue;
  }
  return map;
}

export async function getSetting(key: SettingKey): Promise<string | undefined> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row?.value) return row.value;
  return SETTING_ENV_FALLBACK[key] ?? undefined;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Retorna o base URL público para montar links (agendamento). */
export async function getBaseUrl(): Promise<string> {
  const fromDb = await prisma.setting.findUnique({
    where: { key: "bookingBaseUrl" },
  });
  return (
    fromDb?.value ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}
