import { prisma } from "./db";
import { DEFAULT_TENANT_ID } from "./tenant";

/**
 * Chaves de configuração conhecidas. Cada uma pode vir do banco (tela de
 * Settings, por tenant) ou de uma variável de ambiente (fallback global).
 * O banco tem prioridade.
 *
 * IMPORTANTE: chaves das IAs (OpenAI, Gemini, ElevenLabs) NÃO ficam aqui —
 * são sempre da empresa, lidas direto do env (cobrança centralizada).
 * Por tenant ficam apenas dados do cliente (contas de redes sociais, etc.).
 */
export const SETTING_ENV_FALLBACK: Record<string, string | undefined> = {
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  newsApiKey: process.env.NEWS_API_KEY,
  videoWebhookUrl: process.env.VIDEO_WEBHOOK_URL,
};

export const SECRET_KEYS = new Set([
  "whatsappAccessToken",
  "whatsappVerifyToken",
  "newsApiKey",
  // Instagram (Meta Graph API)
  "instagramPassword",
  "instagramAccessToken",
  "instagramAppSecret",
  // YouTube (Data API v3 / OAuth2)
  "youtubePassword",
  "youtubeClientSecret",
  "youtubeRefreshToken",
  // TikTok (Content Posting API)
  "tiktokPassword",
  "tiktokClientSecret",
  "tiktokAccessToken",
  "tiktokRefreshToken",
  // Kwai (Open Platform)
  "kwaiPassword",
  "kwaiAppSecret",
  "kwaiAccessToken",
  "kwaiRefreshToken",
]);

export type SettingKey =
  | "companyName"
  | "aiPersona"
  | "whatsappAccessToken"
  | "whatsappPhoneNumberId"
  | "whatsappVerifyToken"
  | "whatsappBusinessAccountId"
  | "bookingBaseUrl"
  | "newsApiKey"
  | "videoWebhookUrl"
  // Instagram — Meta Graph API (Content Publishing / Reels)
  | "instagramUser"
  | "instagramPassword"
  | "instagramBusinessAccountId" // IG User ID (conta profissional)
  | "instagramAccessToken" // token de longa duração (instagram_content_publish)
  | "instagramFacebookPageId" // página do Facebook vinculada
  | "instagramAppId" // app da Meta (para renovar o token)
  | "instagramAppSecret"
  // YouTube — Data API v3 (videos.insert via OAuth2)
  | "youtubeUser"
  | "youtubePassword"
  | "youtubeChannelId"
  | "youtubeClientId" // OAuth2 client (Google Cloud Console)
  | "youtubeClientSecret"
  | "youtubeRefreshToken" // obtido com access_type=offline + scope youtube.upload
  | "youtubePrivacyStatus" // public | unlisted | private
  | "youtubeCategoryId" // categoria padrão dos uploads (ex.: 22 = People & Blogs)
  // TikTok — Content Posting API (Direct Post)
  | "tiktokUser"
  | "tiktokPassword"
  | "tiktokClientKey" // app no TikTok for Developers
  | "tiktokClientSecret"
  | "tiktokAccessToken" // token do usuário com scope video.publish
  | "tiktokRefreshToken"
  | "tiktokOpenId" // open_id do usuário autorizado
  | "tiktokPrivacyLevel" // PUBLIC_TO_EVERYONE | MUTUAL_FOLLOW_FRIENDS | FOLLOWER_OF_CREATOR | SELF_ONLY
  // Kwai — Open Platform (user_video_publish)
  | "kwaiUser"
  | "kwaiPassword"
  | "kwaiAppId"
  | "kwaiAppSecret"
  | "kwaiAccessToken"
  | "kwaiRefreshToken"
  | "kwaiOpenId";

export async function getAllSettings(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { tenantId } });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  // aplica fallback de env quando não houver valor no banco
  for (const [key, envValue] of Object.entries(SETTING_ENV_FALLBACK)) {
    if (!map[key] && envValue) map[key] = envValue;
  }
  return map;
}

export async function getSetting(
  key: SettingKey,
  tenantId: string = DEFAULT_TENANT_ID
): Promise<string | undefined> {
  const row = await prisma.setting.findUnique({
    where: { tenantId_key: { tenantId, key } },
  });
  if (row?.value) return row.value;
  return SETTING_ENV_FALLBACK[key] ?? undefined;
}

export async function setSetting(
  tenantId: string,
  key: string,
  value: string
): Promise<void> {
  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key } },
    update: { value },
    create: { tenantId, key, value },
  });
}

/** Retorna o base URL público para montar links (agendamento). */
export async function getBaseUrl(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<string> {
  const fromDb = await prisma.setting.findUnique({
    where: { tenantId_key: { tenantId, key: "bookingBaseUrl" } },
  });
  return (
    fromDb?.value ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}
