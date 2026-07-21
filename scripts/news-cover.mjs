#!/usr/bin/env node
/**
 * Gera a imagem de capa de uma notícia (OpenAI) e faz upload no Azure Blob,
 * devolvendo a URL pública. Roda LOCALMENTE — o fluxo não depende de o servidor
 * de produção ter chave da OpenAI nem conexão de Blob configuradas.
 *
 * O ESTILO é fixo aqui (não vem do chamador) para garantir um PADRÃO visual
 * alinhado à identidade do portal: fundo creme (#faf9f5) com acentos AZUIS
 * (identidade atual do site), ilustração editorial minimalista e SEM texto.
 *
 * Uso como CLI (útil para testar):
 *   node --env-file=.env scripts/news-cover.mjs "Título da notícia" "Produto"
 *
 * Uso como módulo:
 *   import { generateAndUploadCover } from "./news-cover.mjs";
 *
 * Env necessárias:
 *   OPENAI_API_KEY                    chave da OpenAI (geração da imagem)
 *   AZURE_STORAGE_CONNECTION_STRING   conexão da conta de storage
 *   AZURE_STORAGE_CONTAINER           container (default: lustosatech-news)
 */

import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { BlobServiceClient } from "@azure/storage-blob";

const CONTAINER = process.env.AZURE_STORAGE_CONTAINER || "lustosatech-news";

// Motivo visual por categoria — variedade sem fugir do padrão.
const MOTIF = {
  Novidades: "abstract spark of innovation, rising geometric arrow motifs",
  Pesquisa: "abstract laboratory and data motifs, molecular and graph shapes",
  Produto: "clean product/device silhouettes, interface panels, soft grids",
  Política: "institutional and regulation motifs, balanced geometric columns",
  Opinião: "editorial column motif, speech and thought abstract shapes",
  Mercado: "financial market motifs, ascending charts and coin-like circles",
};

/** Monta o prompt de estilo da marca (identidade azul do portal). */
export function buildPrompt({ title, category, summary }) {
  const motif = MOTIF[category] || MOTIF.Novidades;
  return [
    "Editorial magazine cover illustration for a technology & AI news portal.",
    `Theme: ${title}.`,
    summary ? `Context: ${summary}.` : "",
    `Visual motif: ${motif}.`,
    "Style: warm cream off-white background (#faf9f5), minimalist flat vector illustration,",
    "primary accent in deep navy blue (#3a5da8) with lighter steel-blue tones,",
    "supported by soft charcoal and subtle warm neutrals as secondary colors,",
    "clean geometric shapes, generous negative space, subtle paper grain, soft depth,",
    "modern editorial aesthetic, sophisticated and calm.",
    "IMPORTANT: absolutely no text, no words, no letters, no numbers, no logos, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Gera o PNG da capa. Tenta gpt-image-1 e cai para dall-e-3. */
export async function generateCoverImage({ title, category, summary }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Defina OPENAI_API_KEY no ambiente (.env).");
  const client = new OpenAI({ apiKey });
  const prompt = buildPrompt({ title, category, summary });

  try {
    const r = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      quality: "high",
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) throw new Error("gpt-image-1 não retornou b64_json");
    return { buffer: Buffer.from(b64, "base64"), model: "gpt-image-1" };
  } catch (err) {
    const r = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1792x1024",
      quality: "hd",
      response_format: "b64_json",
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) throw new Error(`Falha ao gerar imagem: ${err?.message || err}`);
    return { buffer: Buffer.from(b64, "base64"), model: "dall-e-3" };
  }
}

/** Envia o PNG ao Azure Blob e devolve a URL pública. */
export async function uploadToBlob(buffer, contentType = "image/png") {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) {
    throw new Error("Defina AZURE_STORAGE_CONNECTION_STRING no ambiente (.env).");
  }
  const service = BlobServiceClient.fromConnectionString(conn);
  const container = service.getContainerClient(CONTAINER);
  // acesso "blob" = leitura pública do arquivo (necessário para exibir no site)
  await container.createIfNotExists({ access: "blob" });

  const name = `${Date.now()}-${randomUUID()}.png`;
  const block = container.getBlockBlobClient(name);
  await block.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  return block.url;
}

/** Fluxo completo: gera a capa e devolve a URL pública já no Blob. */
export async function generateAndUploadCover({ title, category, summary }) {
  const { buffer, model } = await generateCoverImage({ title, category, summary });
  const url = await uploadToBlob(buffer);
  return { url, model, bytes: buffer.length };
}

// ---- CLI ----
const isCli = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());
if (isCli) {
  const [, , title, category, summary] = process.argv;
  if (!title) {
    console.error('Uso: node --env-file=.env scripts/news-cover.mjs "Título" [categoria] [resumo]');
    process.exit(1);
  }
  generateAndUploadCover({ title, category, summary })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(JSON.stringify({ error: e.message }, null, 2));
      process.exit(1);
    });
}
