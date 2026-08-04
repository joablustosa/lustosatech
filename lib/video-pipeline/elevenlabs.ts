// Rachel — voz premade da ElevenLabs, disponível via API em qualquer plano
// (vozes da Voice Library exigem plano pago na API).
const PREMADE_FALLBACK_VOICE = "21m00Tcm4TlvDq8ikWAM";
const DEFAULT_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || PREMADE_FALLBACK_VOICE;
const TTS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

async function requestTts(apiKey: string, voice: string, text: string) {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: TTS_MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
}

/**
 * Gera o áudio de narração de uma cena via ElevenLabs (text-to-speech).
 * A voz pode ser definida por vídeo (voiceId do VideoPost); sem ela, usa a
 * voz padrão do env. A chave é sempre da empresa (env ELEVENLABS_API_KEY).
 * Retorna o mp3 como Buffer.
 */
export async function generateNarration(
  text: string,
  voiceId?: string | null
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chave do ElevenLabs não configurada. Defina ELEVENLABS_API_KEY no .env."
    );
  }

  const voice = voiceId?.trim() || DEFAULT_VOICE_ID;
  let res = await requestTts(apiKey, voice, text);

  // Plano gratuito não pode usar vozes da Voice Library via API (402).
  // Nesse caso refazemos com a voz premade padrão em vez de falhar o vídeo.
  if (res.status === 402 && voice !== PREMADE_FALLBACK_VOICE) {
    console.warn(
      `[video-pipeline] Voz "${voice}" exige plano pago no ElevenLabs; usando a voz padrão (Rachel).`
    );
    res = await requestTts(apiKey, PREMADE_FALLBACK_VOICE, text);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const hint =
      res.status === 402
        ? " A conta ElevenLabs é do plano gratuito e a voz escolhida exige plano pago. Escolha uma voz premade (ex.: Rachel) ou faça upgrade da conta."
        : "";
    throw new Error(
      `Falha no ElevenLabs (${res.status}): ${body.slice(0, 300)}${hint}`
    );
  }
  return Buffer.from(await res.arrayBuffer());
}
