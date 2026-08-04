import { GoogleGenAI } from "@google/genai";
import {
  buildStylePrefix,
  veoAspectRatio,
  type FormatOptions,
} from "./format";

// Fallback usado apenas se o ListModels falhar (ex.: instabilidade da API).
// No endpoint v1beta da Gemini API os IDs costumam ser os "-preview";
// os "-001" (GA) são do Vertex AI.
const FALLBACK_MODELS = [
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview",
  "veo-3.1-generate-001",
  "veo-3.1-fast-generate-001",
];
const POLL_MS = 10_000;
const TIMEOUT_MS = 10 * 60_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isModelNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("NOT_FOUND") || msg.includes("is not found");
}

/**
 * Ordena os modelos Veo por preferência: versão mais nova primeiro,
 * qualidade padrão antes de "fast"/"lite", estável (-001) antes de preview.
 */
function sortVeoModels(models: string[]): string[] {
  const score = (m: string) => {
    const version = parseFloat(m.match(/veo-(\d+\.\d+)/)?.[1] ?? "0");
    const quality = m.includes("lite") ? 0 : m.includes("fast") ? 1 : 2;
    const stable = m.includes("preview") ? 0 : 1;
    return version * 100 + quality * 10 + stable;
  };
  return [...models].sort((a, b) => score(b) - score(a));
}

let discoveredModels: string[] | null = null;

/**
 * Consulta o ListModels da Gemini API e retorna os modelos Veo que a chave
 * realmente enxerga e que suportam predictLongRunning (geração de vídeo).
 * O resultado é cacheado no processo. Se a chave for de tier gratuito o
 * Veo não aparece na lista — nesse caso lançamos um erro explicativo.
 */
async function discoverVeoModels(apiKey: string): Promise<string[]> {
  if (discoveredModels) return discoveredModels;
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
      { headers: { "x-goog-api-key": apiKey } }
    );
    const json = (await res.json()) as {
      error?: { message?: string };
      models?: { name: string; supportedGenerationMethods?: string[] }[];
    };
    if (json.error) {
      throw new Error(json.error.message || "erro desconhecido no ListModels");
    }
    const veo = (json.models ?? [])
      .filter(
        (m) =>
          m.name.toLowerCase().includes("veo") &&
          (m.supportedGenerationMethods ?? []).includes("predictLongRunning")
      )
      .map((m) => m.name.replace(/^models\//, ""));
    if (veo.length === 0) {
      throw new Error(
        "A chave GEMINI_API_KEY não tem acesso a nenhum modelo Veo. " +
          "O Veo exige plano pago (billing ativo no projeto do Google AI Studio). " +
          "Verifique o faturamento da chave ou use outra."
      );
    }
    discoveredModels = sortVeoModels(veo);
    console.log(
      `[video-pipeline] Modelos Veo disponíveis: ${discoveredModels.join(", ")}`
    );
    return discoveredModels;
  } catch (err) {
    if (err instanceof Error && err.message.includes("GEMINI_API_KEY")) {
      throw err;
    }
    console.warn(
      `[video-pipeline] ListModels falhou (${err instanceof Error ? err.message : err}); usando lista de fallback.`
    );
    return FALLBACK_MODELS;
  }
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

  // Override manual vem primeiro; depois os modelos descobertos na API.
  const candidates = [
    ...(process.env.VIDEO_VEO_MODEL ? [process.env.VIDEO_VEO_MODEL] : []),
    ...(await discoverVeoModels(apiKey)),
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  const fullPrompt = `${buildStylePrefix(formatOptions)}\n\n${prompt}`;
  const aspectRatio = veoAspectRatio(formatOptions.format);

  let operation: Awaited<ReturnType<typeof ai.models.generateVideos>> | null =
    null;
  let lastError: unknown = null;
  for (const model of candidates) {
    try {
      operation = await ai.models.generateVideos({
        model,
        prompt: fullPrompt,
        config: { aspectRatio },
      });
      break;
    } catch (err) {
      lastError = err;
      if (isModelNotFound(err)) {
        console.warn(
          `[video-pipeline] Modelo Veo "${model}" indisponível, tentando o próximo.`
        );
        continue;
      }
      throw err;
    }
  }
  if (!operation) {
    throw new Error(
      `Nenhum modelo Veo funcionou (tentados: ${candidates.join(", ")}). ` +
        `Último erro: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

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
