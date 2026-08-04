const DEFAULT_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const TTS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

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
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
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
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha no ElevenLabs (${res.status}): ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
