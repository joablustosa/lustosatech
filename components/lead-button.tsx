"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Props {
  label: string;
  whatsapp: string; // ex.: 5521976701610
  productName?: string;
  planOptions?: string[];
  variant?: "primary" | "outline" | "light";
  defaultPlan?: string;
  fullWidth?: boolean;
}

const DEFAULT_PLANS = ["Essencial", "Profissional", "Sob Medida", "Ainda não sei"];

export function LeadButton({
  label,
  whatsapp,
  productName = "LUSTOSA BUILD",
  planOptions,
  variant = "primary",
  defaultPlan = "",
  fullWidth,
}: Props) {
  const plans = planOptions?.length
    ? [...planOptions, "Ainda não sei"]
    : DEFAULT_PLANS;
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [projeto, setProjeto] = useState("");
  const [plano, setPlano] = useState(defaultPlan || "");
  const [mensagem, setMensagem] = useState("");
  const [error, setError] = useState("");

  const btnClass =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-medium text-accent-contrast shadow-sm shadow-brand-600/20 transition hover:bg-accent-hover"
      : variant === "light"
        ? "inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-[#141413] transition hover:opacity-90"
        : "inline-flex items-center justify-center gap-2 rounded-full border border-accent/40 px-6 py-3 text-base font-medium text-accent transition hover:border-accent hover:bg-accent/5 dark:border-accent/40 dark:hover:border-accent";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nome.trim() || !contato.trim()) {
      setError("Preencha ao menos nome e contato.");
      return;
    }
    setSending(true);
    const linhas = [
      `Olá! Vim pelo site da Lustosa Tech e quero falar sobre o *${productName}*.`,
      "",
      `• Nome: ${nome}`,
      `• Contato: ${contato}`,
      projeto ? `• Projeto/empresa: ${projeto}` : "",
      plano ? `• Plano de interesse: ${plano}` : "",
      mensagem ? `• O que preciso: ${mensagem}` : "",
    ].filter(Boolean);
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
      linhas.join("\n")
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSending(false);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${btnClass} ${fullWidth ? "w-full" : ""}`}
      >
        <MessageCircle size={18} /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#faf9f5] p-6 text-[#141413] shadow-2xl dark:bg-[#1f1e1c] dark:text-[#e8e6e1]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-start justify-between">
              <h3 className="font-serif text-2xl font-bold">Vamos conversar</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 opacity-60 hover:opacity-100"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mb-5 text-sm text-black/60 dark:text-white/60">
              Deixe seus dados que te chamamos no WhatsApp para agendar o
              diagnóstico.
            </p>

            <form onSubmit={submit} className="space-y-3">
              <input
                className="w-full rounded-xl border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-black/50 dark:border-white/15 dark:focus:border-white/50"
                placeholder="Seu nome *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
              />
              <input
                className="w-full rounded-xl border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-black/50 dark:border-white/15 dark:focus:border-white/50"
                placeholder="WhatsApp ou e-mail *"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-black/50 dark:border-white/15 dark:focus:border-white/50"
                placeholder="Empresa ou nome do projeto"
                value={projeto}
                onChange={(e) => setProjeto(e.target.value)}
              />
              <select
                className="w-full rounded-xl border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-black/50 dark:border-white/15 dark:focus:border-white/50"
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
              >
                <option value="">Plano de interesse (opcional)</option>
                {plans.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-[80px] w-full rounded-xl border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-black/50 dark:border-white/15 dark:focus:border-white/50"
                placeholder="Conte rapidamente o que você precisa"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-medium text-white transition hover:opacity-90"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Chamar no WhatsApp
              </button>
              <p className="text-center text-xs text-black/40 dark:text-white/40">
                Abre uma conversa no WhatsApp com seus dados já preenchidos.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
