import { prisma } from "../db";
import { describeImage, transcribeAudio } from "../openai";
import { downloadWhatsappMedia, sendWhatsappText } from "../whatsapp";
import { generateReply } from "./agent";

export interface IncomingMessage {
  waPhone: string;
  contactName?: string;
  kind: "text" | "image" | "audio";
  /** Texto da mensagem (para tipo text) ou legenda (para imagem). */
  text?: string;
  /** ID de mídia do WhatsApp (baixa via Graph API). */
  mediaId?: string;
  /** Conteúdo direto em base64 (usado pelo simulador, sem Meta). */
  mediaBase64?: string;
  mimeType?: string;
}

async function getMediaBuffer(
  msg: IncomingMessage
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (msg.mediaBase64) {
    return {
      buffer: Buffer.from(msg.mediaBase64, "base64"),
      mimeType: msg.mimeType || "application/octet-stream",
    };
  }
  if (msg.mediaId) {
    return downloadWhatsappMedia(msg.mediaId);
  }
  throw new Error("Mídia sem mediaId nem mediaBase64.");
}

/**
 * Processa uma mensagem recebida: entende mídia, persiste, gera e envia a
 * resposta da IA. Retorna a resposta e o id da conversa.
 */
export async function processIncomingMessage(
  msg: IncomingMessage,
  options: { sendReply?: boolean } = {}
): Promise<{ reply: string; conversationId: string; understood: string }> {
  const sendReply = options.sendReply ?? true;

  // 1) Interpreta o conteúdo conforme o tipo
  let content = msg.text || "";
  let type: "text" | "image" | "audio" = "text";

  if (msg.kind === "image") {
    type = "image";
    const { buffer, mimeType } = await getMediaBuffer(msg);
    content = await describeImage(
      buffer.toString("base64"),
      mimeType,
      msg.text
    );
  } else if (msg.kind === "audio") {
    type = "audio";
    const { buffer } = await getMediaBuffer(msg);
    content = await transcribeAudio(buffer);
  }

  if (!content) content = "(mensagem vazia)";

  // 2) Conversa (upsert por telefone)
  const conversation = await prisma.conversation.upsert({
    where: { waPhone: msg.waPhone },
    update: {
      lastMessageAt: new Date(),
      ...(msg.contactName ? { contactName: msg.contactName } : {}),
    },
    create: {
      waPhone: msg.waPhone,
      contactName: msg.contactName,
      lastMessageAt: new Date(),
    },
  });

  // 3) Persiste a mensagem recebida
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "in",
      type,
      content,
      mediaUrl: msg.mediaId || null,
    },
  });

  // 4) Gera a resposta da IA
  const reply = await generateReply(conversation.id);

  // 5) Persiste a resposta
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "out",
      type: "text",
      content: reply,
    },
  });

  // 6) Envia pelo WhatsApp (se configurado)
  if (sendReply) {
    try {
      await sendWhatsappText(msg.waPhone, reply);
    } catch (err) {
      console.error("[ingest] falha ao enviar resposta:", err);
    }
  }

  return { reply, conversationId: conversation.id, understood: content };
}
