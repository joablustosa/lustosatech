import { prisma } from "../db";
import { getOpenAI } from "../openai";

export interface ConversationReport {
  resumo: string;
  necessidades: string[];
  objecoes: string[];
  nivelInteresse: "baixo" | "medio" | "alto";
  proximosPassos: string[];
  dadosCliente: string;
}

/**
 * Gera um relatório estruturado da conversa para dar contexto ao vendedor
 * antes de falar com o cliente. Persiste o resultado na conversa.
 */
export async function generateReport(
  conversationId: string
): Promise<ConversationReport> {
  const client = await getOpenAI();

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw new Error("Conversa não encontrada");

  const transcript = conversation.messages
    .map((m) => {
      const who = m.direction === "in" ? "CLIENTE" : "ASSISTENTE";
      const prefix =
        m.type === "audio" ? "[áudio] " : m.type === "image" ? "[imagem] " : "";
      return `${who}: ${prefix}${m.content}`;
    })
    .join("\n");

  const resp = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Você é um analista de vendas. Analise a conversa entre um cliente e o assistente e " +
          "produza um relatório objetivo para o vendedor humano usar antes de fechar a venda. " +
          "Responda em português do Brasil, em JSON com as chaves: " +
          "resumo (string), necessidades (array de strings), objecoes (array de strings), " +
          "nivelInteresse (um de: baixo, medio, alto), proximosPassos (array de strings), " +
          "dadosCliente (string com nome/contato/detalhes identificados).",
      },
      {
        role: "user",
        content: `Contato: ${conversation.contactName || conversation.waPhone}\n\nConversa:\n${transcript || "(sem mensagens)"}`,
      },
    ],
  });

  const raw = resp.choices[0].message.content || "{}";
  let parsed: ConversationReport;
  try {
    parsed = JSON.parse(raw) as ConversationReport;
  } catch {
    parsed = {
      resumo: raw,
      necessidades: [],
      objecoes: [],
      nivelInteresse: "medio",
      proximosPassos: [],
      dadosCliente: "",
    };
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { reportJson: JSON.stringify(parsed), reportAt: new Date() },
  });

  return parsed;
}
