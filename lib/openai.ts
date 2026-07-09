import OpenAI from "openai";
import { getSetting } from "./settings";

export async function getOpenAI(): Promise<OpenAI> {
  const apiKey = await getSetting("openaiApiKey");
  if (!apiKey) {
    throw new Error(
      "Chave da OpenAI não configurada. Defina em Configurações ou no .env (OPENAI_API_KEY)."
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
