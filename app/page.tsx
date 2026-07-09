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

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <MessageCircle size={20} />
          </span>
          ZapVenda
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
          Responda qualquer dúvida sobre sua empresa e{" "}
          <span className="text-brand-600">agende reuniões</span> no automático
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg muted">
          Sua IA entende texto, áudio e imagens, responde com base nos seus
          documentos, marca reuniões e ainda entrega um relatório completo da
          conversa para você fechar a venda.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/admin/login" className="btn-primary px-6 py-3 text-base">
            Acessar painel <ArrowRight size={18} />
          </Link>
          <Link href="/agendar" className="btn-outline px-6 py-3 text-base">
            Ver página de agendamento
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-5 sm:grid-cols-3">
        <Feature
          icon={<FileText size={22} />}
          title="Documentos .md"
          desc="Importe tudo sobre a empresa e a IA passa a responder com base nesse conhecimento."
        />
        <Feature
          icon={<CalendarCheck size={22} />}
          title="Agendamento"
          desc="A IA identifica interesse e envia o link para o cliente marcar uma reunião."
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
        ZapVenda · Automação de atendimento e vendas por WhatsApp
      </footer>
    </main>
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
