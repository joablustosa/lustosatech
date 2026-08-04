"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Check,
  KeyRound,
  Bot,
  MessageCircle,
  Newspaper,
  Clapperboard,
  Share2,
} from "lucide-react";

type Values = Record<string, string>;
type Secrets = Record<string, boolean>;

type SocialField = {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
};

/**
 * Configurações por plataforma, conforme a API oficial de publicação de cada
 * uma. Tudo é enviado no webhook de entrega junto com o link do vídeo, apenas
 * para as plataformas marcadas na postagem.
 */
const SOCIAL_PLATFORMS: {
  id: string;
  label: string;
  description: string;
  fields: SocialField[];
}[] = [
  {
    id: "instagram",
    label: "Instagram",
    description:
      "Publicação via Meta Graph API (Reels). Exige conta profissional " +
      "vinculada a uma Página do Facebook e token com a permissão " +
      "instagram_content_publish.",
    fields: [
      { key: "instagramUser", label: "Usuário (@handle)", placeholder: "@minhaempresa" },
      { key: "instagramPassword", label: "Senha da conta", secret: true },
      {
        key: "instagramBusinessAccountId",
        label: "ID da conta profissional (IG User ID)",
        placeholder: "17841400000000000",
        hint: "Conta Business/Creator do Instagram vinculada à Página.",
      },
      {
        key: "instagramAccessToken",
        label: "Access Token (longa duração)",
        secret: true,
        hint: "Token de usuário/página com instagram_content_publish.",
      },
      {
        key: "instagramFacebookPageId",
        label: "ID da Página do Facebook vinculada",
        placeholder: "103200000000000",
      },
      { key: "instagramAppId", label: "App ID (Meta for Developers)" },
      {
        key: "instagramAppSecret",
        label: "App Secret (Meta)",
        secret: true,
        hint: "Usado para renovar o access token de longa duração.",
      },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    description:
      "Publicação via YouTube Data API v3 (videos.insert) com OAuth2 e o " +
      "escopo youtube.upload. Crie as credenciais no Google Cloud Console.",
    fields: [
      { key: "youtubeUser", label: "E-mail da conta Google", placeholder: "canal@gmail.com" },
      { key: "youtubePassword", label: "Senha da conta", secret: true },
      { key: "youtubeChannelId", label: "ID do canal", placeholder: "UCxxxxxxxxxxxxxxxxxxxxxx" },
      {
        key: "youtubeClientId",
        label: "OAuth Client ID (Google Cloud)",
        placeholder: "xxxx.apps.googleusercontent.com",
      },
      { key: "youtubeClientSecret", label: "OAuth Client Secret", secret: true },
      {
        key: "youtubeRefreshToken",
        label: "Refresh Token",
        secret: true,
        hint: "Gerado na autorização com access_type=offline e escopo youtube.upload.",
      },
      {
        key: "youtubePrivacyStatus",
        label: "Privacidade padrão dos uploads",
        options: [
          { value: "", label: "Padrão (público)" },
          { value: "public", label: "Público" },
          { value: "unlisted", label: "Não listado" },
          { value: "private", label: "Privado" },
        ],
      },
      {
        key: "youtubeCategoryId",
        label: "Categoria padrão (ID)",
        placeholder: "22",
        hint: "Ex.: 22 = Pessoas e blogs, 28 = Ciência e tecnologia.",
      },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    description:
      "Publicação via TikTok Content Posting API (Direct Post) com o escopo " +
      "video.publish. Crie o app no TikTok for Developers; até passar na " +
      "auditoria do TikTok, os posts ficam com visibilidade privada.",
    fields: [
      { key: "tiktokUser", label: "Usuário (@handle)", placeholder: "@minhaempresa" },
      { key: "tiktokPassword", label: "Senha da conta", secret: true },
      { key: "tiktokClientKey", label: "Client Key (TikTok for Developers)" },
      { key: "tiktokClientSecret", label: "Client Secret", secret: true },
      {
        key: "tiktokAccessToken",
        label: "Access Token do usuário",
        secret: true,
        hint: "Token OAuth com o escopo video.publish (validade de 24h).",
      },
      {
        key: "tiktokRefreshToken",
        label: "Refresh Token",
        secret: true,
        hint: "Validade de 365 dias; usado para renovar o access token.",
      },
      { key: "tiktokOpenId", label: "Open ID do usuário autorizado" },
      {
        key: "tiktokPrivacyLevel",
        label: "Privacidade padrão dos posts",
        options: [
          { value: "", label: "Padrão (público)" },
          { value: "PUBLIC_TO_EVERYONE", label: "Público" },
          { value: "MUTUAL_FOLLOW_FRIENDS", label: "Amigos (seguem um ao outro)" },
          { value: "FOLLOWER_OF_CREATOR", label: "Seguidores" },
          { value: "SELF_ONLY", label: "Somente eu" },
        ],
        hint: "Precisa estar entre as opções permitidas da conta (creator_info).",
      },
    ],
  },
  {
    id: "kwai",
    label: "Kwai",
    description:
      "Publicação via Kwai Open Platform (start_upload + publish) com o " +
      "escopo user_video_publish. Registre o app no portal de desenvolvedores.",
    fields: [
      { key: "kwaiUser", label: "Usuário (@handle)", placeholder: "@minhaempresa" },
      { key: "kwaiPassword", label: "Senha da conta", secret: true },
      { key: "kwaiAppId", label: "App ID (Kwai Open Platform)", placeholder: "ks700000000000000" },
      { key: "kwaiAppSecret", label: "App Secret", secret: true },
      {
        key: "kwaiAccessToken",
        label: "Access Token do usuário",
        secret: true,
        hint: "Token OAuth com o escopo user_video_publish.",
      },
      { key: "kwaiRefreshToken", label: "Refresh Token", secret: true },
      { key: "kwaiOpenId", label: "Open ID do usuário autorizado" },
    ],
  },
];

const SOCIAL_SECRET_KEYS = SOCIAL_PLATFORMS.flatMap((p) =>
  p.fields.filter((f) => f.secret).map((f) => f.key)
);

export default function SettingsPage() {
  const [values, setValues] = useState<Values>({});
  const [secretsSet, setSecretsSet] = useState<Secrets>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [socialTab, setSocialTab] = useState(SOCIAL_PLATFORMS[0].id);

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
      setValues((prev) => {
        const next: Values = {
          ...prev,
          whatsappAccessToken: "",
          newsApiKey: "",
        };
        for (const key of SOCIAL_SECRET_KEYS) next[key] = "";
        next.whatsappVerifyToken = prev.whatsappVerifyToken;
        return next;
      });
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

      {/* Pipeline de vídeo */}
      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Clapperboard size={18} className="text-brand-600" /> Pipeline de
          vídeo (postagens)
        </h2>
        <div>
          <label className="label">
            Webhook de entrega do vídeo final (opcional)
          </label>
          <input
            className="input"
            value={values.videoWebhookUrl || ""}
            onChange={(e) => set("videoWebhookUrl", e.target.value)}
            placeholder="https://sua-api.com/webhook/videos"
          />
          <p className="mt-1.5 text-xs muted">
            O worker envia um <code>POST</code> JSON com a URL do vídeo final,
            título, conta, plataformas e credenciais das redes marcadas quando
            o vídeo fica pronto. Se ficar em branco, o vídeo permanece
            disponível no Azure Blob (link no modal da postagem).
          </p>
        </div>
        <p className="text-xs muted">
          As chaves das IAs (OpenAI, Gemini, ElevenLabs) são da plataforma e
          configuradas via variáveis de ambiente — não é necessário informar
          nada aqui.
        </p>
      </section>

      {/* Contas de redes sociais (uma aba por plataforma) */}
      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Share2 size={18} className="text-brand-600" /> Contas de redes
          sociais
        </h2>
        <p className="text-xs muted">
          Configurações de publicação de cada plataforma (conforme a API
          oficial de cada uma). Tudo é enviado no webhook de entrega junto com
          o link do vídeo, apenas para as plataformas marcadas na postagem.
        </p>

        {/* Abas */}
        <div className="flex flex-wrap gap-1 border-b [border-color:var(--border)]">
          {SOCIAL_PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSocialTab(p.id)}
              className={
                socialTab === p.id
                  ? "-mb-px rounded-t-lg border border-b-0 px-4 py-2 text-sm font-semibold text-brand-600 [border-color:var(--border)]"
                  : "px-4 py-2 text-sm muted hover:text-[var(--text)]"
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {SOCIAL_PLATFORMS.filter((p) => p.id === socialTab).map((p) => (
          <div key={p.id} className="space-y-4">
            <p className="text-xs muted">{p.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {p.fields.map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  {f.options ? (
                    <select
                      className="input"
                      value={values[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    >
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={f.secret ? "input font-mono" : "input"}
                      type={f.secret ? "password" : "text"}
                      value={values[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={
                        f.secret && secretsSet[f.key]
                          ? "•••••••• (configurado — deixe em branco para manter)"
                          : f.placeholder || ""
                      }
                    />
                  )}
                  {f.hint && <p className="mt-1 text-xs muted">{f.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
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
