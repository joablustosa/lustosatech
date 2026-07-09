import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mic, Image as ImageIcon, CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime, formatTime } from "@/lib/utils";
import { ReportPanel } from "@/components/report-panel";
import type { ConversationReport } from "@/lib/ai/report";

export const dynamic = "force-dynamic";

export default async function ConversationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      meetings: { include: { slot: true } },
    },
  });

  if (!conversation) notFound();

  let report: ConversationReport | null = null;
  if (conversation.reportJson) {
    try {
      report = JSON.parse(conversation.reportJson) as ConversationReport;
    } catch {
      report = null;
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/conversations"
        className="inline-flex items-center gap-1 text-sm muted hover:underline"
      >
        <ArrowLeft size={15} /> Voltar
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {conversation.contactName || conversation.waPhone}
          </h1>
          <p className="text-sm muted">{conversation.waPhone}</p>
        </div>
        {conversation.meetings.length > 0 && (
          <div className="card flex items-center gap-2 px-4 py-2 text-sm">
            <CalendarCheck size={16} className="text-brand-600" />
            Reunião: {formatDateTime(conversation.meetings[0].slot.startsAt)}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Chat */}
        <section className="card flex flex-col p-4">
          <div className="flex-1 space-y-3">
            {conversation.messages.length === 0 ? (
              <p className="p-6 text-center text-sm muted">Sem mensagens.</p>
            ) : (
              conversation.messages.map((m) => {
                const mine = m.direction === "out";
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        mine
                          ? "bg-brand-600 text-white"
                          : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {m.type !== "text" && (
                        <span
                          className={`mb-1 flex items-center gap-1 text-xs ${mine ? "text-white/80" : "muted"}`}
                        >
                          {m.type === "audio" ? (
                            <Mic size={12} />
                          ) : (
                            <ImageIcon size={12} />
                          )}
                          {m.type === "audio"
                            ? "Áudio transcrito"
                            : "Imagem analisada"}
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <span
                        className={`mt-1 block text-right text-[10px] ${mine ? "text-white/70" : "muted"}`}
                      >
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Relatório */}
        <aside>
          <ReportPanel conversationId={conversation.id} initialReport={report} />
        </aside>
      </div>
    </div>
  );
}
