"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import type { ConversationReport } from "@/lib/ai/report";

const interestLabel: Record<string, string> = {
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};
const interestStyle: Record<string, string> = {
  alto: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  medio:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  baixo: "bg-black/5 text-slate-500 dark:bg-white/10",
};

export function ReportPanel({
  conversationId,
  initialReport,
}: {
  conversationId: string;
  initialReport: ConversationReport | null;
}) {
  const [report, setReport] = useState<ConversationReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/conversations/${conversationId}/report`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Falha ao gerar relatório.");
      return;
    }
    setReport(data);
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles size={18} className="text-brand-600" /> Relatório IA
        </h2>
        <button
          className="btn-ghost px-2 text-sm text-brand-600"
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          {report ? "Atualizar" : "Gerar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!report && !loading && (
        <p className="text-sm muted">
          Gere um relatório com o resumo da conversa, necessidades, objeções e
          próximos passos para fechar a venda.
        </p>
      )}

      {report && (
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Interesse:</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${interestStyle[report.nivelInteresse] || ""}`}
            >
              {interestLabel[report.nivelInteresse] || report.nivelInteresse}
            </span>
          </div>

          <Block title="Resumo">
            <p className="muted">{report.resumo}</p>
          </Block>

          {report.dadosCliente && (
            <Block title="Dados do cliente">
              <p className="muted">{report.dadosCliente}</p>
            </Block>
          )}

          <ListBlock title="Necessidades" items={report.necessidades} />
          <ListBlock title="Objeções" items={report.objecoes} />
          <ListBlock title="Próximos passos" items={report.proximosPassos} />
        </div>
      )}
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase muted">{title}</p>
      {children}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase muted">{title}</p>
      <ul className="list-inside list-disc space-y-0.5 muted">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
