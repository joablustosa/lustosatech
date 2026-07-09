import Link from "next/link";
import {
  MessagesSquare,
  CalendarCheck,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { isWhatsappConfigured } from "@/lib/whatsapp";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [
    conversationCount,
    meetingCount,
    docCount,
    recentConversations,
    upcomingMeetings,
    waOk,
    openaiKey,
  ] = await Promise.all([
    prisma.conversation.count(),
    prisma.meeting.count({ where: { status: "confirmado" } }),
    prisma.document.count({ where: { enabled: true } }),
    prisma.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 5,
    }),
    prisma.meeting.findMany({
      where: { status: "confirmado", slot: { startsAt: { gte: new Date() } } },
      include: { slot: true },
      orderBy: { slot: { startsAt: "asc" } },
      take: 5,
    }),
    isWhatsappConfigured(),
    getSetting("openaiApiKey"),
  ]);

  const setupPending = !waOk || !openaiKey;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm muted">Visão geral da sua automação</p>
      </div>

      {setupPending && (
        <Link
          href="/admin/settings"
          className="card flex items-center justify-between gap-4 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Configuração pendente
            </p>
            <p className="text-amber-700 dark:text-amber-400">
              {!openaiKey && "Falta a chave da OpenAI. "}
              {!waOk && "Falta configurar o WhatsApp. "}
              Clique para configurar.
            </p>
          </div>
          <ArrowRight className="text-amber-700 dark:text-amber-400" size={20} />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<MessagesSquare size={20} />}
          label="Conversas"
          value={conversationCount}
        />
        <Stat
          icon={<CalendarCheck size={20} />}
          label="Reuniões marcadas"
          value={meetingCount}
        />
        <Stat
          icon={<FileText size={20} />}
          label="Documentos ativos"
          value={docCount}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <MessagesSquare size={18} /> Conversas recentes
          </h2>
          {recentConversations.length === 0 ? (
            <p className="text-sm muted">Nenhuma conversa ainda.</p>
          ) : (
            <ul className="space-y-1">
              {recentConversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/conversations/${c.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span className="font-medium">
                      {c.contactName || c.waPhone}
                    </span>
                    <span className="muted">{formatDateTime(c.lastMessageAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Clock size={18} /> Próximas reuniões
          </h2>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm muted">Nenhuma reunião agendada.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingMeetings.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm [border-color:var(--border)]"
                >
                  <div>
                    <p className="font-medium">{m.clientName}</p>
                    <p className="muted">{m.clientEmail || m.clientPhone}</p>
                  </div>
                  <span className="text-right font-medium text-brand-600">
                    {formatDateTime(m.slot.startsAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm muted">{label}</p>
    </div>
  );
}
