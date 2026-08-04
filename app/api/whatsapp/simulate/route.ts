import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api";
import { processIncomingMessage } from "@/lib/ai/ingest";

const schema = z.object({
  waPhone: z.string().min(3),
  contactName: z.string().optional(),
  kind: z.enum(["text", "image", "audio"]),
  text: z.string().optional(),
  mediaBase64: z.string().optional(),
  mimeType: z.string().optional(),
});

/**
 * Injeta uma mensagem "recebida" para exercitar todo o pipeline de IA
 * (transcrição de áudio, visão de imagem, resposta) sem depender da Meta.
 * Não envia nada para o WhatsApp real.
 */
export async function POST(req: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const result = await processIncomingMessage(parsed.data, {
      sendReply: false,
      tenantId: s.tenantId,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao processar mensagem.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
