import { getSetting } from "./settings";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function credentials() {
  const token = await getSetting("whatsappAccessToken");
  const phoneNumberId = await getSetting("whatsappPhoneNumberId");
  return { token, phoneNumberId };
}

export async function isWhatsappConfigured(): Promise<boolean> {
  const { token, phoneNumberId } = await credentials();
  return Boolean(token && phoneNumberId);
}

/** Envia uma mensagem de texto para um número via Cloud API. */
export async function sendWhatsappText(
  to: string,
  text: string
): Promise<void> {
  const { token, phoneNumberId } = await credentials();
  if (!token || !phoneNumberId) {
    // Sem credenciais (ex.: modo de simulação) — apenas ignora o envio real.
    console.warn("[whatsapp] Credenciais ausentes; envio real ignorado.");
    return;
  }

  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: true, body: text.slice(0, 4096) },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao enviar mensagem WhatsApp (${res.status}): ${body}`);
  }
}

/** Baixa uma mídia (imagem/áudio) pelo media ID. Retorna buffer + mimeType. */
export async function downloadWhatsappMedia(
  mediaId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { token } = await credentials();
  if (!token) throw new Error("Token do WhatsApp não configurado.");

  // 1) Descobre a URL temporária da mídia
  const metaRes = await fetch(`${GRAPH_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) {
    throw new Error(`Falha ao obter URL da mídia (${metaRes.status})`);
  }
  const meta = (await metaRes.json()) as { url: string; mime_type: string };

  // 2) Baixa o binário (requer o mesmo header de autorização)
  const binRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!binRes.ok) {
    throw new Error(`Falha ao baixar mídia (${binRes.status})`);
  }
  const arrayBuffer = await binRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: meta.mime_type || "application/octet-stream",
  };
}
