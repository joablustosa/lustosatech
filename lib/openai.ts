import OpenAI from "openai";

/**
 * A chave da OpenAI é sempre da empresa (env), nunca por tenant — o consumo
 * das IAs é cobrado de forma centralizada.
 */
export async function getOpenAI(): Promise<OpenAI> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chave da OpenAI não configurada. Defina OPENAI_API_KEY no .env."
    );
  }
  return new OpenAI({ apiKey });
}

/** Descreve/entende uma imagem usando GPT-4o vision. */
export async function describeImage(
  imageBase64: string,
  mimeType: string,
  caption?: string
): Promise<string> {
  const client = await getOpenAI();
  const resp = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Descreva de forma objetiva o que aparece nesta imagem enviada por um cliente no WhatsApp. " +
              "Se houver texto, documento, print ou produto, extraia as informações relevantes." +
              (caption ? ` Legenda do cliente: "${caption}".` : ""),
          },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
        ],
      },
    ],
  });
  return resp.choices[0]?.message?.content?.trim() || "(imagem sem descrição)";
}

/**
 * Gera uma imagem de capa (cover) para uma notícia usando o modelo de imagem da
 * OpenAI. O ESTILO é fixo aqui (não vem do chamador) para garantir um PADRÃO
 * visual consistente, alinhado à identidade do portal: fundo creme (#faf9f5),
 * ilustração editorial minimalista, sem texto/letras (a IA erra letras).
 *
 * Retorna o PNG como Buffer, pronto para upload no Blob.
 */
export async function generateCoverImage(opts: {
  title: string;
  category?: string;
  summary?: string;
}): Promise<Buffer> {
  const client = await getOpenAI();

  // Motivo visual por categoria — mantém variedade sem fugir do padrão.
  const MOTIF: Record<string, string> = {
    Novidades: "abstract spark of innovation, rising geometric arrow motifs",
    Pesquisa: "abstract laboratory and data motifs, molecular and graph shapes",
    Produto: "clean product/device silhouettes, interface panels, soft grids",
    Política: "institutional and regulation motifs, balanced geometric columns",
    Opinião: "editorial column motif, speech and thought abstract shapes",
    Mercado: "financial market motifs, ascending charts and coin-like circles",
  };
  const motif = MOTIF[opts.category || "Novidades"] || MOTIF.Novidades;

  // PROMPT DE ESTILO FIXO = padrão da marca.
  const prompt = [
    "Editorial magazine cover illustration for a technology & AI news portal.",
    `Theme: ${opts.title}.`,
    opts.summary ? `Context: ${opts.summary}.` : "",
    `Visual motif: ${motif}.`,
    "Style: warm cream off-white background (#faf9f5), minimalist flat vector illustration,",
    "muted sophisticated palette of terracotta, warm ochre, soft charcoal and sage,",
    "clean geometric shapes, generous negative space, subtle paper grain, soft depth,",
    "modern Anthropic-like editorial aesthetic, tasteful and calm.",
    "IMPORTANT: absolutely no text, no words, no letters, no numbers, no logos, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");

  // Tenta gpt-image-1 (mais novo, retorna b64). Cai para dall-e-3 se indisponível.
  try {
    const resp = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      quality: "high",
      n: 1,
    });
    const b64 = resp.data?.[0]?.b64_json;
    if (!b64) throw new Error("gpt-image-1 sem b64_json");
    return Buffer.from(b64, "base64");
  } catch {
    const resp = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1792x1024",
      quality: "hd",
      response_format: "b64_json",
      n: 1,
    });
    const b64 = resp.data?.[0]?.b64_json;
    if (!b64) throw new Error("Falha ao gerar imagem (dall-e-3 sem b64_json)");
    return Buffer.from(b64, "base64");
  }
}

/** Transcreve áudio (ogg/opus do WhatsApp) usando Whisper. */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename = "audio.ogg"
): Promise<string> {
  const client = await getOpenAI();
  // O SDK aceita um File-like. Usamos a API global File (Node 20+).
  const file = new File([new Uint8Array(audioBuffer)], filename, {
    type: "audio/ogg",
  });
  const resp = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "pt",
  });
  return resp.text?.trim() || "(áudio sem transcrição)";
}
