import type { VideoPost, Tenant } from "@prisma/client";
import { getSetting, type SettingKey } from "../settings";

type PlatformCreds = { user: string | null; password: string | null };

/**
 * Monta o bloco de credenciais das redes sociais marcadas no post, lidas das
 * Configurações do tenant, para a API de destino conseguir publicar.
 */
async function collectCredentials(
  post: VideoPost,
  tenantId: string
): Promise<Record<string, PlatformCreds>> {
  const platforms: Array<[string, boolean, SettingKey, SettingKey]> = [
    ["instagram", post.platformInstagram, "instagramUser", "instagramPassword"],
    ["youtube", post.platformYoutube, "youtubeUser", "youtubePassword"],
    ["tiktok", post.platformTiktok, "tiktokUser", "tiktokPassword"],
    ["kwai", post.platformKwai, "kwaiUser", "kwaiPassword"],
  ];

  const credentials: Record<string, PlatformCreds> = {};
  for (const [name, enabled, userKey, passKey] of platforms) {
    if (!enabled) continue;
    const [user, password] = await Promise.all([
      getSetting(userKey, tenantId),
      getSetting(passKey, tenantId),
    ]);
    credentials[name] = { user: user || null, password: password || null };
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
