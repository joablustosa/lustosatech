import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { SECRET_KEYS, setSetting } from "@/lib/settings";

const ALLOWED_KEYS = [
  "companyName",
  "aiPersona",
  "openaiApiKey",
  "whatsappAccessToken",
  "whatsappPhoneNumberId",
  "whatsappVerifyToken",
  "whatsappBusinessAccountId",
  "bookingBaseUrl",
  // Chave usada por agentes/automação para publicar notícias (x-api-key).
  // Fica aqui para poder ser definida pela tela, sem depender de variável de
  // ambiente (que exige reiniciar o App Service).
  "newsApiKey",
];

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rows = await prisma.setting.findMany();
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
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const body = (await req.json()) as Record<string, unknown>;

  for (const key of ALLOWED_KEYS) {
    if (!(key in body)) continue;
    const value = body[key];
    if (typeof value !== "string") continue;
    // Para segredos, string vazia significa "não alterar".
    if (SECRET_KEYS.has(key) && value.trim() === "") continue;
    await setSetting(key, value);
  }

  return NextResponse.json({ ok: true });
}
