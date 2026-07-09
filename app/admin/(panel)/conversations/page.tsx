import Link from "next/link";
import { MessagesSquare, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { SimulatorCard } from "@/components/simulator-card";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  ativo: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  agendado:
    "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  fechado: "bg-black/5 text-slate-500 dark:bg-white/10",
};

export default async function ConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversas</h1>
        <p className="mt-1 text-sm muted">
          Todo o histórico de atendimento da IA
        </p>
      </div>

      <SimulatorCard />

      {conversations.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center">
          <MessagesSquare className="muted" size={32} />
          <p className="font-medium">Nenhuma conversa ainda</p>
          <p className="text-sm muted">
            As conversas aparecerão aqui quando os clientes mandarem mensagem —
            ou use o testador acima.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/admin/conversations/${c.id}`}
              className="card flex items-center justify-between gap-4 p-4 transition hover:border-brand-300"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">
                    {c.contactName || c.waPhone}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[c.status] || ""}`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm muted">
                  {c.waPhone} · {c._count.messages} mensagens ·{" "}
                  {formatDateTime(c.lastMessageAt)}
                </p>
              </div>
              <ChevronRight className="muted shrink-0" size={18} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
