"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, Send, Paperclip, Loader2 } from "lucide-react";

export function SimulatorCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("5511999999999");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"text" | "image" | "audio">("text");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    understood: string;
    reply: string;
  } | null>(null);
  const [error, setError] = useState("");

  function toBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function send() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const body: any = { waPhone: phone, kind, contactName: "Cliente Teste" };
      if (kind === "text") {
        body.text = text;
      } else if (file) {
        body.mediaBase64 = await toBase64(file);
        body.mimeType = file.type;
        if (text) body.text = text;
      } else {
        setError("Selecione um arquivo.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao processar.");
      } else {
        setResult(data);
        setText("");
        setFile(null);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        className="btn-outline w-full justify-start"
        onClick={() => setOpen(true)}
      >
        <Bot size={16} className="text-brand-600" /> Testar assistente (simular
        mensagem)
      </button>
    );
  }

  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Bot size={18} className="text-brand-600" /> Testador do assistente
        </h2>
        <button className="btn-ghost px-2 text-sm" onClick={() => setOpen(false)}>
          Fechar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Telefone (simulado)</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as any)}
          >
            <option value="text">Texto</option>
            <option value="image">Imagem</option>
            <option value="audio">Áudio</option>
          </select>
        </div>
        <div className="flex items-end">
          {kind === "text" ? (
            <span className="text-xs muted">Digite a mensagem abaixo</span>
          ) : (
            <label className="btn-outline w-full cursor-pointer">
              <Paperclip size={15} />
              {file ? file.name.slice(0, 16) : "Escolher arquivo"}
              <input
                type="file"
                hidden
                accept={kind === "image" ? "image/*" : "audio/*"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            kind === "text"
              ? "Ex.: Quais são os planos de vocês?"
              : "Legenda (opcional)"
          }
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
        />
        <button className="btn-primary" onClick={send} disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Enviar
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="space-y-3 border-t pt-4 [border-color:var(--border)]">
          {kind !== "text" && (
            <div>
              <p className="text-xs font-semibold uppercase muted">
                IA entendeu ({kind === "audio" ? "transcrição" : "descrição"})
              </p>
              <p className="mt-1 rounded-xl bg-black/5 p-3 text-sm dark:bg-white/5">
                {result.understood}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase text-brand-600">
              Resposta do assistente
            </p>
            <p className="mt-1 rounded-xl bg-brand-50 p-3 text-sm dark:bg-brand-900/20">
              {result.reply}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
