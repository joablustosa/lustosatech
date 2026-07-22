"use client";

import { useEffect, useState } from "react";
import { Save, Check, KeyRound, Bot, MessageCircle, Newspaper } from "lucide-react";

type Values = Record<string, string>;
type Secrets = Record<string, boolean>;

export default function SettingsPage() {
  const [values, setValues] = useState<Values>({});
  const [secretsSet, setSecretsSet] = useState<Secrets>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setValues(data.values || {});
        setSecretsSet(data.secretsSet || {});
      }
      setLoading(false);
    })();
  }, []);

  function set(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      // recarrega para refletir segredos preenchidos
      const r = await fetch("/api/settings");
      if (r.ok) {
        const data = await r.json();
        setSecretsSet(data.secretsSet || {});
      }
      // limpa campos de segredo do formulário
      setValues((prev) => ({
        ...prev,
        openaiApiKey: "",
        whatsappAccessToken: "",
        newsApiKey: "",
        whatsappVerifyToken: prev.whatsappVerifyToken,
      }));
    }
  }

  if (loading) return <p className="text-sm muted">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm muted">
          Credenciais e comportamento da automação
        </p>
      </div>

      {/* Empresa & IA */}
      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Bot size={18} className="text-brand-600" /> Empresa & IA
        </h2>
        <div>
          <label className="label">Nome da empresa</label>
          <input
            className="input"
            value={values.companyName || ""}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="Minha Empresa Ltda"
          />
        </div>
        <div>
          <label className="label">Personalidade / instruções da IA</label>
          <textarea
            className="input min-h-[120px]"
            value={values.aiPersona || ""}
            onChange={(e) => set("aiPersona", e.target.value)}
            placeholder="Como a IA deve se comportar, tom de voz, regras..."
          />
        </div>
        <div>
          <label className="label">Chave da OpenAI (sk-...)</label>
          <input
            className="input font-mono"
            type="password"
            value={values.openaiApiKey || ""}
            onChange={(e) => set("openaiApiKey", e.target.value)}
            placeholder={
              secretsSet.openaiApiKey
                ? "•••••••• (configurada — deixe em branco para manter)"
                : "sk-..."
            }
          />
        </div>
      </section>

      {/* Automação de notícias */}
      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Newspaper size={18} className="text-brand-600" /> Automação de notícias
        </h2>
        <div>
          <label className="label">
            Chave de publicação (header <code>x-api-key</code>)
          </label>
          <input
            className="input font-mono"
            type="password"
            value={values.newsApiKey || ""}
            onChange={(e) => set("newsApiKey", e.target.value)}
            placeholder={
              secretsSet.newsApiKey
                ? "•••••••• (configurada — deixe em branco para manter)"
                : "news_..."
            }
          />
          <p className="mt-1.5 text-xs muted">
            Usada pelos agentes para publicar em <code>POST /api/news</code>. O
            valor salvo aqui tem prioridade sobre a variável de ambiente
            <code> NEWS_API_KEY</code> e passa a valer imediatamente, sem
            reiniciar o app.
          </p>
        </div>
      </section>

      {/* WhatsApp */}
      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <MessageCircle size={18} className="text-brand-600" /> WhatsApp Cloud
          API
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Phone Number ID</label>
            <input
              className="input font-mono"
              value={values.whatsappPhoneNumberId || ""}
              onChange={(e) => set("whatsappPhoneNumberId", e.target.value)}
              placeholder="1234567890"
            />
          </div>
          <div>
            <label className="label">Business Account ID (opcional)</label>
            <input
              className="input font-mono"
              value={values.whatsappBusinessAccountId || ""}
              onChange={(e) => set("whatsappBusinessAccountId", e.target.value)}
              placeholder="9876543210"
            />
          </div>
        </div>
        <div>
          <label className="label">Access Token</label>
          <input
            className="input font-mono"
            type="password"
            value={values.whatsappAccessToken || ""}
            onChange={(e) => set("whatsappAccessToken", e.target.value)}
            placeholder={
              secretsSet.whatsappAccessToken
                ? "•••••••• (configurado — deixe em branco para manter)"
                : "EAAG..."
            }
          />
        </div>
        <div>
          <label className="label">
            Verify Token (usado no cadastro do webhook)
          </label>
          <input
            className="input font-mono"
            value={values.whatsappVerifyToken || ""}
            onChange={(e) => set("whatsappVerifyToken", e.target.value)}
            placeholder={
              secretsSet.whatsappVerifyToken
                ? "•••••••• (configurado)"
                : "meu-verify-token"
            }
          />
          <p className="mt-1.5 text-xs muted">
            URL do webhook:{" "}
            <code className="rounded bg-black/5 px-1 dark:bg-white/10">
              {typeof window !== "undefined" ? window.location.origin : ""}
              /api/whatsapp/webhook
            </code>
          </p>
        </div>
      </section>

      {/* Agendamento */}
      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <KeyRound size={18} className="text-brand-600" /> Agendamento
        </h2>
        <div>
          <label className="label">URL base pública (para o link de agendamento)</label>
          <input
            className="input"
            value={values.bookingBaseUrl || ""}
            onChange={(e) => set("bookingBaseUrl", e.target.value)}
            placeholder="https://seudominio.com"
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-brand-600">
            <Check size={16} /> Salvo!
          </span>
        )}
      </div>
    </div>
  );
}
