import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api";
import { getOpenAI } from "@/lib/openai";

const MODEL = process.env.VIDEO_SCRIPT_MODEL || "gpt-4o";

const bodySchema = z.object({
  title: z.string().min(1, "Informe o título do vídeo"),
  prompt: z.string().optional(),
});

/**
 * Agente de ideia/aperfeiçoamento de prompt: a partir do título (e do
 * rascunho do usuário, se houver), gera um prompt de roteiro pronto para o
 * pipeline. Nada é salvo aqui — o usuário confirma no formulário.
 */
export async function POST(req: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { title, prompt } = parsed.data;
  const draft = prompt?.trim();

  const client = await getOpenAI();
  const resp = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em criar prompts de roteiro para vídeos de " +
          "redes sociais (Instagram, YouTube, TikTok, Kwai) gerados por IA. " +
          "Escreva em português do Brasil um prompt claro e completo que um " +
          "roteirista de IA usará para criar o vídeo. O prompt deve definir: " +
          "tema e mensagem central, público-alvo, tom de voz, gancho inicial, " +
          "principais pontos a abordar e chamada para ação no final. " +
          "NÃO mencione formato do vídeo (vertical/horizontal), resolução nem " +
          "estilo visual — isso é configurado separadamente. " +
          "Responda APENAS com o texto do prompt, sem títulos, sem markdown e " +
          "sem comentários.",
      },
      {
        role: "user",
        content: draft
          ? `Título do vídeo: ${title}\n\n` +
            `Melhore e complete este rascunho de prompt, mantendo a intenção ` +
            `original do autor:\n${draft}`
          : `Título do vídeo: ${title}\n\n` +
            `Crie o prompt de roteiro ideal para este vídeo.`,
      },
    ],
  });

  const idea = resp.choices[0]?.message?.content?.trim();
  if (!idea) {
    return NextResponse.json(
      { error: "A IA não retornou uma sugestão. Tente novamente." },
      { status: 502 }
    );
  }
  return NextResponse.json({ prompt: idea });
}
