import { getOpenAI } from "../openai";
import {
  buildScriptHint,
  buildStylePrefix,
  type FormatOptions,
} from "./format";

export interface Scene {
  sequence: number;
  prompt: string;
  narration: string;
}

const SCRIPT_MODEL = process.env.VIDEO_SCRIPT_MODEL || "gpt-4o";

/**
 * Gera o roteiro completo do vídeo a partir do título e do prompt do evento.
 * O roteiro pode ser longo (até ~1h de conteúdo) — é salvo em LONGTEXT.
 */
export async function generateScript(opts: {
  title: string;
  prompt: string;
  accountName: string;
  formatOptions: FormatOptions;
}): Promise<string> {
  const client = await getOpenAI();

  const resp = await client.chat.completions.create({
    model: SCRIPT_MODEL,
    temperature: 0.7,
    max_tokens: 8000,
    messages: [
      {
        role: "system",
        content:
          "Você é um roteirista profissional de vídeos para redes sociais " +
          "(Instagram, YouTube, TikTok, Kwai). Escreva roteiros em português " +
          "do Brasil, envolventes, com gancho forte nos primeiros segundos, " +
          "desenvolvimento claro e chamada para ação no final. Estruture o " +
          "roteiro em cenas, com descrição visual e narração de cada cena.",
      },
      {
        role: "user",
        content:
          `Título do vídeo: ${opts.title}\n` +
          `Conta que vai publicar: ${opts.accountName}\n` +
          `Formato e estilo: ${buildScriptHint(opts.formatOptions)}\n\n` +
          `Instruções/prompt do roteiro:\n${opts.prompt}\n\n` +
          "Escreva o roteiro completo do vídeo.",
      },
    ],
  });

  const script = resp.choices[0]?.message?.content?.trim();
  if (!script) throw new Error("A IA não retornou o roteiro.");
  return script;
}

/**
 * Divide o roteiro em cenas sequenciais, cada uma com um prompt visual
 * (para gerar o clipe no Gemini/Veo) e o texto de narração (ElevenLabs).
 */
export async function splitIntoScenes(
  script: string,
  formatOptions: FormatOptions
): Promise<Scene[]> {
  const client = await getOpenAI();

  const resp = await client.chat.completions.create({
    model: SCRIPT_MODEL,
    temperature: 0.3,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Você divide roteiros de vídeo em cenas para geração por IA. " +
          "Responda APENAS em JSON com a chave \"scenes\": um array de objetos " +
          "{sequence (int, começando em 1), prompt (string: descrição VISUAL " +
          "detalhada da cena em inglês, para um gerador de vídeo por IA — " +
          "câmera, ambiente, ação, estilo; sem texto na tela), narration " +
          "(string: texto de narração da cena em português do Brasil)}. " +
          "Cada cena deve ter ~8 segundos de duração. Use no máximo 20 cenas, " +
          "resumindo se necessário. " +
          "Todos os prompts visuais devem seguir este estilo obrigatório: " +
          buildStylePrefix(formatOptions),
      },
      {
        role: "user",
        content: `Divida este roteiro em cenas:\n\n${script}`,
      },
    ],
  });

  const raw = resp.choices[0]?.message?.content || "{}";
  let scenes: Scene[] = [];
  try {
    const parsed = JSON.parse(raw) as { scenes?: Scene[] };
    scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  } catch {
    throw new Error("A IA retornou cenas em formato inválido.");
  }

  scenes = scenes
    .filter((s) => s && typeof s.prompt === "string" && s.prompt.trim())
    .map((s, i) => ({
      sequence: Number(s.sequence) || i + 1,
      prompt: String(s.prompt).trim(),
      narration: String(s.narration ?? "").trim(),
    }))
    .sort((a, b) => a.sequence - b.sequence)
    // reindexa para garantir sequência 1..N sem buracos/duplicatas
    .map((s, i) => ({ ...s, sequence: i + 1 }));

  if (scenes.length === 0) {
    throw new Error("Nenhuma cena foi gerada a partir do roteiro.");
  }
  return scenes;
}
