import type { VideoPost, Tenant } from "@prisma/client";
import { getSetting, type SettingKey } from "../settings";

/**
 * Campos de configuração enviados no webhook para cada plataforma, conforme a
 * API oficial de publicação de cada uma. O nome no payload (à esquerda) é o
 * que a API de destino recebe; a SettingKey (à direita) é onde o tenant
 * configura na tela de Configurações.
 */
const PLATFORM_CONFIG_KEYS: Record<string, Record<string, SettingKey>> = {
  // Meta Graph API — Content Publishing (Reels): POST /{ig-user-id}/media
  instagram: {
    user: "instagramUser",
    password: "instagramPassword",
    businessAccountId: "instagramBusinessAccountId",
    accessToken: "instagramAccessToken",
    facebookPageId: "instagramFacebookPageId",
    appId: "instagramAppId",
    appSecret: "instagramAppSecret",
  },
  // YouTube Data API v3 — videos.insert via OAuth2 (scope youtube.upload)
  youtube: {
    user: "youtubeUser",
    password: "youtubePassword",
    channelId: "youtubeChannelId",
    clientId: "youtubeClientId",
    clientSecret: "youtubeClientSecret",
    refreshToken: "youtubeRefreshToken",
    privacyStatus: "youtubePrivacyStatus",
    categoryId: "youtubeCategoryId",
  },
  // TikTok Content Posting API — /v2/post/publish/video/init/ (video.publish)
  tiktok: {
    user: "tiktokUser",
    password: "tiktokPassword",
    clientKey: "tiktokClientKey",
    clientSecret: "tiktokClientSecret",
    accessToken: "tiktokAccessToken",
    refreshToken: "tiktokRefreshToken",
    openId: "tiktokOpenId",
    privacyLevel: "tiktokPrivacyLevel",
  },
  // Kwai Open Platform — photo/start_upload + photo/publish (user_video_publish)
  kwai: {
    user: "kwaiUser",
    password: "kwaiPassword",
    appId: "kwaiAppId",
    appSecret: "kwaiAppSecret",
    accessToken: "kwaiAccessToken",
    refreshToken: "kwaiRefreshToken",
    openId: "kwaiOpenId",
  },
};

type PlatformCreds = Record<string, string | null>;

/**
 * Monta o bloco de credenciais/configurações das redes sociais marcadas no
 * post, lidas das Configurações do tenant, para a API de destino publicar.
 */
async function collectCredentials(
  post: VideoPost,
  tenantId: string
): Promise<Record<string, PlatformCreds>> {
  const enabled: Array<[string, boolean]> = [
    ["instagram", post.platformInstagram],
    ["youtube", post.platformYoutube],
    ["tiktok", post.platformTiktok],
    ["kwai", post.platformKwai],
  ];

  const credentials: Record<string, PlatformCreds> = {};
  for (const [name, isOn] of enabled) {
    if (!isOn) continue;
    const fields = PLATFORM_CONFIG_KEYS[name];
    const entries = Object.entries(fields);
    const values = await Promise.all(
      entries.map(([, key]) => getSetting(key, tenantId))
    );
    credentials[name] = Object.fromEntries(
      entries.map(([field], i) => [field, values[i] || null])
    );
  }
  return credentials;
}

/**
 * Envia o vídeo final para a API de destino (webhook configurável por tenant
 * na tela de Configurações, com fallback na env VIDEO_WEBHOOK_URL).
 *
 * O webhook é opcional: sem URL configurada, o vídeo permanece disponível no
 * Azure Blob (finalVideoUrl do post) e a entrega é pulada. Retorna true se o
 * webhook foi chamado, false se foi pulado.
 */
export async function deliverVideo(
  post: VideoPost,
  tenant: Pick<Tenant, "id" | "name" | "slug">,
  finalVideoUrl: string
): Promise<boolean> {
  const webhookUrl = await getSetting("videoWebhookUrl", tenant.id);
  if (!webhookUrl) {
    console.log(
      `[video-worker] webhook não configurado; vídeo mantido no Blob: ${finalVideoUrl}`
    );
    return false;
  }

  const credentials = await collectCredentials(post, tenant.id);

  const payload = {
    event: "video.ready",
    videoUrl: finalVideoUrl,
    post: {
      id: post.id,
      title: post.title,
      accountName: post.accountName,
      scheduledAt: post.scheduledAt.toISOString(),
      platforms: {
        instagram: post.platformInstagram,
        youtube: post.platformYoutube,
        tiktok: post.platformTiktok,
        kwai: post.platformKwai,
      },
    },
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    // Credenciais das contas do tenant, só das plataformas marcadas no post.
    credentials,
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Webhook de entrega respondeu ${res.status}: ${body.slice(0, 300)}`
    );
  }
  return true;
}
