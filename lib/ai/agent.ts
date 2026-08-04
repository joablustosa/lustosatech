import type OpenAI from "openai";
import { prisma } from "../db";
import { getOpenAI } from "../openai";
import { getSetting, getBaseUrl } from "../settings";
import { formatDateTime } from "../utils";

const MAX_HISTORY = 20;
const MAX_DOC_CHARS = 40000; // guarda simples de contexto

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

async function buildSystemPrompt(tenantId: string): Promise<string> {
  const companyName =
    (await getSetting("companyName", tenantId)) || "nossa empresa";
  const persona =
    (await getSetting("aiPersona", tenantId)) ||
    "Você é um assistente de atendimento simpático e objetivo.";

  const docs = await prisma.document.findMany({
    where: { tenantId, enabled: true },
    orderBy: { createdAt: "asc" },
  });

  let knowledge = "";
  for (const d of docs) {
    const block = `\n\n### Documento: ${d.title}\n${d.content}`;
    if (knowledge.length + block.length > MAX_DOC_CHARS) break;
    knowledge += block;
  }
  if (!knowledge) {
    knowledge =
      "\n\n(Nenhum documento cadastrado ainda. Seja honesto se não souber algo.)";
  }

  return `${persona}

Você representa a empresa "${companyName}" e atende clientes pelo WhatsApp.

REGRAS:
- Responda SEMPRE em português do Brasil, de forma natural e amigável, como no WhatsApp (mensagens curtas, sem markdown pesado).
- Baseie-se apenas nas informações abaixo sobre a empresa. Se não tiver a informação, diga que vai verificar com um especialista e ofereça agendar uma reunião.
- Nunca invente preços, prazos ou dados que não estejam nos documentos.
- Quando o cliente demonstrar interesse real (quer contratar, quer uma demonstração, quer falar com alguém, tem dúvidas complexas), use a ferramenta "oferecer_agendamento" para propor uma reunião.
- Seja consultivo: entenda a necessidade do cliente antes de empurrar a venda.

=== BASE DE CONHECIMENTO DA EMPRESA ===${knowledge}
=== FIM DA BASE DE CONHECIMENTO ===`;
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "oferecer_agendamento",
      description:
        "Use quando o cliente quiser agendar uma reunião, uma demonstração, falar com um especialista, ou demonstrar interesse claro em contratar. Retorna o link de agendamento e os próximos horários livres.",
      parameters: {
        type: "object",
        properties: {
          motivo: {
            type: "string",
            description: "Breve motivo do interesse do cliente (para contexto).",
          },
        },
        required: [],
      },
    },
  },
];

async function runSchedulingTool(tenantId: string): Promise<string> {
  const baseUrl = await getBaseUrl(tenantId);
  const slots = await prisma.availabilitySlot.findMany({
    where: { tenantId, isBooked: false, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 3,
  });
  const link = `${baseUrl}/agendar`;
  if (slots.length === 0) {
    return JSON.stringify({
      link,
      horarios: [],
      observacao:
        "Não há horários pré-definidos no momento, mas o cliente pode acessar o link para ver a disponibilidade.",
    });
  }
  return JSON.stringify({
    link,
    horarios: slots.map((s) => formatDateTime(s.startsAt)),
  });
}

/**
 * Gera a resposta da IA para uma conversa, considerando todo o histórico
 * (incluindo transcrições de áudio e descrições de imagem já persistidas).
 */
export async function generateReply(conversationId: string): Promise<string> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { tenantId: true },
  });
  if (!conversation) throw new Error("Conversa não encontrada");
  const tenantId = conversation.tenantId;

  const client = await getOpenAI();

  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: MAX_HISTORY,
  });

  const systemPrompt = await buildSystemPrompt(tenantId);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m): ChatMessage => {
      let content = m.content;
      if (m.type === "audio") content = `[Áudio transcrito] ${m.content}`;
      if (m.type === "image") content = `[Imagem recebida] ${m.content}`;
      return {
        role: m.direction === "in" ? "user" : "assistant",
        content,
      };
    }),
  ];

  const first = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    max_tokens: 600,
    messages,
    tools,
    tool_choice: "auto",
  });

  const choice = first.choices[0].message;

  // Se a IA não pediu ferramenta, retorna direto.
  if (!choice.tool_calls || choice.tool_calls.length === 0) {
    return choice.content?.trim() || "Desculpe, pode repetir?";
  }

  // Executa as ferramentas e faz uma segunda chamada para redigir a resposta final.
  messages.push(choice);
  for (const call of choice.tool_calls) {
    let result = "{}";
    if (call.type === "function" && call.function.name === "oferecer_agendamento") {
      result = await runSchedulingTool(tenantId);
    }
    messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: result,
    });
  }

  const second = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    max_tokens: 600,
    messages,
  });

  return (
    second.choices[0].message.content?.trim() ||
    "Podemos marcar uma reunião? Acesse o link para escolher um horário."
  );
}
