import { GoogleGenAI } from "@google/genai";
import {
  buildStylePrefix,
  veoAspectRatio,
  type FormatOptions,
} from "./format";

const VEO_MODEL = process.env.VIDEO_VEO_MODEL || "veo-3.0-generate-001";
const POLL_MS = 10_000;
const TIMEOUT_MS = 10 * 60_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Gera um clipe de vídeo (~8s) no Gemini (Veo) a partir do prompt visual da
 * cena. O prefixo de formato/qualidade/estilo do post é adicionado
 * automaticamente ao início do prompt e o aspect ratio vai na config da API.
 * A operação é assíncrona: cria, faz polling até concluir e baixa o mp4.
 * A chave é sempre da empresa (env GEMINI_API_KEY).
 */
export async function generateVideoClip(
  prompt: string,
  formatOptions: FormatOptions
): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chave do Gemini não configurada. Defina GEMINI_API_KEY no .env."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let operation = await ai.models.generateVideos({
    model: VEO_MODEL,
    prompt: `${buildStylePrefix(formatOptions)}\n\n${prompt}`,
    config: {
      aspectRatio: veoAspectRatio(formatOptions.format),
    },
  });

  const started = Date.now();
  while (!operation.done) {
    if (Date.now() - started > TIMEOUT_MS) {
      throw new Error("Tempo esgotado aguardando o Veo gerar o clipe.");
    }
    await sleep(POLL_MS);
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const video = operation.response?.generatedVideos?.[0]?.video;
  const uri = video?.uri;
  if (!uri) {
    throw new Error(
      `Veo não retornou vídeo. ${operation.error ? JSON.stringify(operation.error) : ""}`
    );
  }

  // O download do arquivo exige a API key na query/header.
  const sep = uri.includes("?") ? "&" : "?";
  const res = await fetch(`${uri}${sep}key=${apiKey}`);
  if (!res.ok) {
    throw new Error(`Falha ao baixar clipe do Veo (${res.status}).`);
  }
  return Buffer.from(await res.arrayBuffer());
}
