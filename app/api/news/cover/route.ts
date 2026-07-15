import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasValidApiKey } from "@/lib/news";
import { auth } from "@/lib/auth";
import { generateCoverImage } from "@/lib/openai";
import { uploadToBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";
// Geração de imagem pode levar alguns segundos.
export const maxDuration = 120;

const schema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  category: z.string().optional(),
  summary: z.string().optional(),
});

/**
 * Gera uma imagem de capa on-brand (via OpenAI, estilo fixo no servidor) e faz
 * upload no Azure Blob, devolvendo a URL pública. Feito para AGENTES: aceita a
 * mesma x-api-key do POST /api/news, então a automação não precisa da chave da
 * OpenAI nem da conexão do Blob — tudo já está configurado no servidor.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const authorized = !!session?.user || (await hasValidApiKey(req));
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const png = await generateCoverImage(parsed.data);
    const url = await uploadToBlob(png, "image/png", "news-cover.png");
    return NextResponse.json({ url, mediaType: "image" }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao gerar a capa.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
