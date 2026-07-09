import Link from "next/link";
import {
  MessageCircle,
  FileText,
  CalendarCheck,
  Sparkles,
  Mic,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [companyName, conversationCount, meetingCount, docCount, openSlots] =
    await Promise.all([
      getSetting("companyName"),
      prisma.conversation.count(),
      prisma.meeting.count({ where: { status: "confirmado" } }),
      prisma.document.count({ where: { enabled: true } }),
      prisma.availabilitySlot.count({
        where: { isBooked: false, startsAt: { gte: new Date() } },
      }),
    ]);

  const brand = companyName || "Lustosa Tech";

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <MessageCircle size={20} />
          </span>
          {brand}
        </div>
        <Link href="/admin/login" className="btn-outline">
          Entrar no painel
        </Link>
      </header>

      <section className="mt-20 text-center animate-fade-in">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
          <Sparkles size={15} /> Atendimento com IA no WhatsApp
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {brand} responde qualquer dúvida e{" "}
          <span className="text-brand-600">agenda reuniões</span> no automático
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg muted">
          Nossa IA entende texto, áudio e imagens, responde com base nos
          documentos da empresa, marca reuniões e entrega relatório completo da
          conversa para você fechar a venda.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/admin/login" className="btn-primary px-6 py-3 text-base">
            Acessar painel <ArrowRight size={18} />
          </Link>
          <Link href="/agendar" className="btn-outline px-6 py-3 text-base">
            Agendar reunião
            {openSlots > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                {openSlots} horários
              </span>
            )}
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-4">
        <Stat label="Conversas" value={conversationCount} />
        <Stat label="Reuniões" value={meetingCount} />
        <Stat label="Documentos" value={docCount} />
        <Stat label="Horários livres" value={openSlots} />
      </section>

      <section className="mt-12 grid gap-5 sm:grid-cols-3">
        <Feature
          icon={<FileText size={22} />}
          title="Documentos .md"
          desc={`${docCount} documento(s) ativo(s) alimentam as respostas da IA sobre a ${brand}.`}
        />
        <Feature
          icon={<CalendarCheck size={22} />}
          title="Agendamento"
          desc={
            openSlots > 0
              ? `${openSlots} horário(s) disponível(is) para reunião agora.`
              : "A IA identifica interesse e envia o link para o cliente marcar uma reunião."
          }
        />
        <Feature
          icon={<Sparkles size={22} />}
          title="Relatório da conversa"
          desc="Resumo com necessidades, objeções e próximos passos para você fechar a venda."
        />
      </section>

      <section className="mt-6 grid gap-5 sm:grid-cols-2">
        <Feature
          icon={<Mic size={22} />}
          title="Entende áudios"
          desc="Transcreve mensagens de voz automaticamente e responde no contexto."
        />
        <Feature
          icon={<ImageIcon size={22} />}
          title="Entende imagens"
          desc="Analisa prints, documentos e fotos que o cliente enviar."
        />
      </section>

      <footer className="mt-24 text-center text-sm muted">
        {brand} · Automação de atendimento e vendas por WhatsApp
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold text-brand-600">{value}</p>
      <p className="text-xs muted">{label}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm muted">{desc}</p>
    </div>
  );
}
