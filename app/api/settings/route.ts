import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";
import { SECRET_KEYS, setSetting } from "@/lib/settings";

const ALLOWED_KEYS = [
  "companyName",
  "aiPersona",
  "whatsappAccessToken",
  "whatsappPhoneNumberId",
  "whatsappVerifyToken",
  "whatsappBusinessAccountId",
  "bookingBaseUrl",
  // Chave usada por agentes/automação para publicar notícias (x-api-key).
  // Fica aqui para poder ser definida pela tela, sem depender de variável de
  // ambiente (que exige reiniciar o App Service).
  "newsApiKey",
  // URL que recebe o vídeo final gerado pelo pipeline (webhook de entrega).
  "videoWebhookUrl",
  // Contas de redes sociais do tenant (dados do cliente, enviados no webhook
  // para a API de publicação). As chaves das IAs NÃO ficam aqui: são env.
  // Instagram — Meta Graph API
  "instagramUser",
  "instagramPassword",
  "instagramBusinessAccountId",
  "instagramAccessToken",
  "instagramFacebookPageId",
  "instagramAppId",
  "instagramAppSecret",
  // YouTube — Data API v3 (OAuth2)
  "youtubeUser",
  "youtubePassword",
  "youtubeChannelId",
  "youtubeClientId",
  "youtubeClientSecret",
  "youtubeRefreshToken",
  "youtubePrivacyStatus",
  "youtubeCategoryId",
  // TikTok — Content Posting API
  "tiktokUser",
  "tiktokPassword",
  "tiktokClientKey",
  "tiktokClientSecret",
  "tiktokAccessToken",
  "tiktokRefreshToken",
  "tiktokOpenId",
  "tiktokPrivacyLevel",
  // Kwai — Open Platform
  "kwaiUser",
  "kwaiPassword",
  "kwaiAppId",
  "kwaiAppSecret",
  "kwaiAccessToken",
  "kwaiRefreshToken",
  "kwaiOpenId",
];

export async function GET() {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const rows = await prisma.setting.findMany({ where: { tenantId: s.tenantId } });
  const values: Record<string, string> = {};
  for (const r of rows) values[r.key] = r.value;

  // Não devolve o valor dos segredos, só indica se estão preenchidos.
  const secretsSet: Record<string, boolean> = {};
  for (const key of SECRET_KEYS) {
    secretsSet[key] = Boolean(values[key]);
    delete values[key];
  }

  return NextResponse.json({ values, secretsSet });
}

export async function PUT(req: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const body = (await req.json()) as Record<string, unknown>;

  for (const key of ALLOWED_KEYS) {
    if (!(key in body)) continue;
    const value = body[key];
    if (typeof value !== "string") continue;
    // Para segredos, string vazia significa "não alterar".
    if (SECRET_KEYS.has(key) && value.trim() === "") continue;
    await setSetting(s.tenantId, key, value);
  }

  return NextResponse.json({ ok: true });
}
