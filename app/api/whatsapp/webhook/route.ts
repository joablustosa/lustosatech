import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { processIncomingMessage, IncomingMessage } from "@/lib/ai/ingest";

/** Verificação do webhook (Meta chama com hub.challenge). */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const verifyToken = await getSetting("whatsappVerifyToken");

  if (mode === "subscribe" && token && token === verifyToken) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/** Recebe mensagens do WhatsApp. */
export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const contactName: string | undefined =
          value.contacts?.[0]?.profile?.name;

        for (const m of value.messages ?? []) {
          const msg = mapWhatsappMessage(m, contactName);
          if (msg) {
            // Processa de forma sequencial para persistir contexto na ordem.
            await processIncomingMessage(msg, { sendReply: true });
          }
        }
      }
    }
  } catch (err) {
    console.error("[webhook] erro ao processar:", err);
  }

  // Sempre responde 200 para a Meta não reenviar.
  return NextResponse.json({ ok: true });
}

function mapWhatsappMessage(
  m: any,
  contactName?: string
): IncomingMessage | null {
  const waPhone: string = m.from;
  if (!waPhone) return null;

  switch (m.type) {
    case "text":
      return { waPhone, contactName, kind: "text", text: m.text?.body || "" };
    case "image":
      return {
        waPhone,
        contactName,
        kind: "image",
        mediaId: m.image?.id,
        mimeType: m.image?.mime_type,
        text: m.image?.caption,
      };
    case "audio":
      return {
        waPhone,
        contactName,
        kind: "audio",
        mediaId: m.audio?.id,
        mimeType: m.audio?.mime_type,
      };
    case "voice" as string:
      return {
        waPhone,
        contactName,
        kind: "audio",
        mediaId: m.audio?.id ?? m.voice?.id,
        mimeType: m.audio?.mime_type,
      };
    default:
      // tipos não suportados (localização, sticker, etc.) — trata como texto genérico
      return {
        waPhone,
        contactName,
        kind: "text",
        text: "(mensagem não textual recebida)",
      };
  }
}
