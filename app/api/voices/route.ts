import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";

export const dynamic = "force-dynamic";

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

/**
 * Lista as vozes disponíveis no ElevenLabs (chave da empresa, via env) para o
 * seletor de voz por vídeo. Se a chave não estiver configurada, devolve
 * configured=false e o front usa input de texto livre.
 */
export async function GET() {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, voices: [] });
  }

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
      // Vozes mudam raramente; evita bater na API a cada abertura de modal.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json({ configured: false, voices: [] });
    }
    const data = (await res.json()) as { voices?: ElevenLabsVoice[] };
    const voices = (data.voices ?? []).map((v) => ({
      id: v.voice_id,
      name: v.name,
      language: v.labels?.language,
    }));
    return NextResponse.json({ configured: true, voices });
  } catch {
    return NextResponse.json({ configured: false, voices: [] });
  }
}
