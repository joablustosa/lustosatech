"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Check,
  Instagram,
  Youtube,
  Send,
  Loader2,
  Film,
  FileText,
  ExternalLink,
  Smartphone,
  Monitor,
  Clapperboard,
  Sparkles,
  Brush,
  Presentation,
  Wand2,
  Zap,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

export interface VideoPost {
  id: string;
  title: string;
  prompt: string;
  accountName: string;
  scheduledAt: string;
  platformInstagram: boolean;
  platformYoutube: boolean;
  platformTiktok: boolean;
  platformKwai: boolean;
  autoSend: boolean;
  voiceId?: string | null;
  format?: string;
  resolution?: string;
  style?: string;
  status: string;
  finalVideoUrl?: string | null;
  error?: string | null;
}

interface Voice {
  id: string;
  name: string;
  language?: string;
  premade?: boolean;
}

interface VideoPromptDetail {
  id: string;
  sequence: number;
  prompt: string;
  narration: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  status: string;
}

interface VideoPostDetail extends VideoPost {
  script?: {
    id: string;
    content: string;
    prompts: VideoPromptDetail[];
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-black/10 text-current dark:bg-white/10" },
  scheduled: { label: "Agendado", className: "bg-brand-600/10 text-brand-600" },
  generating_script: { label: "Gerando roteiro...", className: "bg-amber-500/15 text-amber-600" },
  script_ready: { label: "Roteiro pronto", className: "bg-amber-500/15 text-amber-600" },
  generating_assets: { label: "Gerando vídeos e áudio...", className: "bg-amber-500/15 text-amber-600" },
  assembling: { label: "Montando vídeo...", className: "bg-amber-500/15 text-amber-600" },
  sending: { label: "Enviando...", className: "bg-amber-500/15 text-amber-600" },
  sent: { label: "Enviado", className: "bg-emerald-500/15 text-emerald-600" },
  published: { label: "Publicado", className: "bg-emerald-500/15 text-emerald-600" },
  failed: { label: "Falhou", className: "bg-red-500/15 text-red-600" },
};

const PIPELINE_STEPS = [
  {
    id: "generating_script",
    label: "Gerar roteiro (GPT)",
    statuses: ["generating_script"],
  },
  {
    id: "script_ready",
    label: "Dividir em cenas",
    statuses: ["script_ready"],
  },
  {
    id: "generating_assets",
    label: "Gerar clipes e narração",
    statuses: ["generating_assets"],
  },
  {
    id: "assembling",
    label: "Montar vídeo final",
    statuses: ["assembling"],
  },
  {
    id: "sending",
    label: "Entregar (webhook / Blob)",
    statuses: ["sending"],
  },
  {
    id: "sent",
    label: "Concluído",
    statuses: ["sent", "published"],
  },
];

const IN_PROGRESS_STATUSES = new Set([
  "generating_script",
  "script_ready",
  "generating_assets",
  "assembling",
  "sending",
]);

const PIPELINE_ORDER = [
  "generating_script",
  "script_ready",
  "generating_assets",
  "assembling",
  "sending",
  "sent",
];

function stepState(
  status: string,
  stepIndex: number
): "done" | "current" | "pending" | "failed" {
  if (status === "failed") return stepIndex === 0 ? "failed" : "pending";
  if (status === "sent" || status === "published") return "done";
  const cur = PIPELINE_ORDER.indexOf(status);
  if (cur < 0) return "pending";
  if (stepIndex < cur) return "done";
  if (stepIndex === cur) return "current";
  return "pending";
}

type FormState = {
  title: string;
  prompt: string;
  accountName: string;
  date: string;
  time: string;
  platformInstagram: boolean;
  platformYoutube: boolean;
  platformTiktok: boolean;
  platformKwai: boolean;
  autoSend: boolean;
  voiceId: string;
  format: string;
  resolution: string;
  style: string;
};

// Opções de formato/qualidade/estilo — escolhidas visualmente pelo usuário e
// adicionadas automaticamente ao prompt pelo pipeline (não precisa repetir).
const FORMAT_CHOICES = [
  {
    value: "vertical",
    label: "Short / Vertical",
    hint: "9:16 — Reels, TikTok, Shorts",
    icon: <Smartphone size={18} />,
  },
  {
    value: "horizontal",
    label: "Horizontal",
    hint: "16:9 — YouTube, TV",
    icon: <Monitor size={18} />,
  },
];

const RESOLUTION_CHOICES = [
  { value: "fullhd", label: "Full HD", hint: "1080p (recomendado)" },
  { value: "4k", label: "4K", hint: "Ultra HD, arquivo maior" },
];

const STYLE_CHOICES = [
  {
    value: "cinematic",
    label: "Cinematográfico",
    hint: "Filmagem realista de cinema",
    icon: <Clapperboard size={18} />,
  },
  {
    value: "anime",
    label: "Anime",
    hint: "Animação estilo anime",
    icon: <Sparkles size={18} />,
  },
  {
    value: "cartoon2d",
    label: "Desenho 2D",
    hint: "Cartoon divertido e leve",
    icon: <Brush size={18} />,
  },
  {
    value: "presentation",
    label: "Apresentação",
    hint: "Slides animados, educativo",
    icon: <Presentation size={18} />,
  },
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function emptyForm(day?: Date): FormState {
  const base = day ?? new Date();
  const withDefaultTime = new Date(base);
  if (!day || (day.getHours() === 0 && day.getMinutes() === 0)) {
    withDefaultTime.setHours(10, 0, 0, 0);
  }
  return {
    title: "",
    prompt: "",
    accountName: "",
    date: toDateInput(withDefaultTime),
    time: toTimeInput(withDefaultTime),
    platformInstagram: false,
    platformYoutube: false,
    platformTiktok: false,
    platformKwai: false,
    autoSend: false,
    voiceId: "",
    format: "vertical",
    resolution: "fullhd",
    style: "cinematic",
  };
}

function formFromPost(post: VideoPost): FormState {
  const d = new Date(post.scheduledAt);
  return {
    title: post.title,
    prompt: post.prompt,
    accountName: post.accountName,
    date: toDateInput(d),
    time: toTimeInput(d),
    platformInstagram: post.platformInstagram,
    platformYoutube: post.platformYoutube,
    platformTiktok: post.platformTiktok,
    platformKwai: post.platformKwai,
    autoSend: post.autoSend,
    voiceId: post.voiceId ?? "",
    format: post.format ?? "vertical",
    resolution: post.resolution ?? "fullhd",
    style: post.style ?? "cinematic",
  };
}

function eventColor(post: VideoPost) {
  if (post.platformInstagram) return "bg-[#e1306c] hover:bg-[#c13584]";
  if (post.platformYoutube) return "bg-[#ff0000] hover:bg-[#cc0000]";
  if (post.platformTiktok) return "bg-[#111111] hover:bg-[#333] dark:bg-[#25f4ee] dark:text-black dark:hover:bg-[#1ad4cf]";
  if (post.platformKwai) return "bg-[#ff4906] hover:bg-[#e03d00]";
  return "bg-brand-600 hover:bg-brand-700";
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 17.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.18 8.18 0 0 0 4.76 1.52V6.79a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function KwaiIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 14.5L12 13.2l-3.5 3.3V7.5L12 10.8l3.5-3.3v9z" />
    </svg>
  );
}

export function VideoPostCalendar() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VideoPost | null>(null);
  const [detail, setDetail] = useState<VideoPostDetail | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesConfigured, setVoicesConfigured] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaSuggestion, setIdeaSuggestion] = useState<string | null>(null);
  const [sendingNow, setSendingNow] = useState(false);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setVoices(d.voices ?? []);
          setVoicesConfigured(Boolean(d.configured));
        }
      })
      .catch(() => {});
  }, []);

  const range = useMemo(() => {
    const from = startOfMonth(cursor);
    from.setDate(from.getDate() - from.getDay());
    const to = endOfMonth(cursor);
    const endPad = 6 - to.getDay();
    to.setDate(to.getDate() + endPad);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [cursor]);

  const days = useMemo(() => {
    const list: Date[] = [];
    const d = new Date(range.from);
    while (d <= range.to) {
      list.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return list;
  }, [range]);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });
    const res = await fetch(`/api/video-posts?${qs}`);
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  // Polling: enquanto o modal estiver aberto em um status de pipeline,
  // atualiza o post + detalhe a cada 3s. O processamento roda no servidor —
  // o modal NÃO precisa ficar aberto, mas se estiver, o usuário vê o progresso.
  useEffect(() => {
    if (!modalOpen || !editing) return;
    if (
      !IN_PROGRESS_STATUSES.has(editing.status) &&
      editing.status !== "failed" &&
      editing.status !== "sent"
    ) {
      return;
    }
    // Só faz polling contínuo enquanto está em progresso.
    if (!IN_PROGRESS_STATUSES.has(editing.status)) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/video-posts/${editing.id}`);
        if (!res.ok || cancelled) return;
        const d: VideoPostDetail = await res.json();
        if (cancelled) return;
        setDetail(d);
        setEditing((prev) =>
          prev && prev.id === d.id
            ? {
                ...prev,
                status: d.status,
                error: d.error,
                finalVideoUrl: d.finalVideoUrl,
              }
            : prev
        );
        setPosts((list) =>
          list.map((p) =>
            p.id === d.id
              ? {
                  ...p,
                  status: d.status,
                  error: d.error,
                  finalVideoUrl: d.finalVideoUrl,
                }
              : p
          )
        );
      } catch {
        /* ignore transient errors */
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [modalOpen, editing?.id, editing?.status]);

  // Também atualiza a grade do calendário se houver posts em andamento.
  useEffect(() => {
    const anyRunning = posts.some((p) => IN_PROGRESS_STATUSES.has(p.status));
    if (!anyRunning || modalOpen) return;
    const id = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(id);
  }, [posts, modalOpen, load]);

  function openCreate(day?: Date) {
    setEditing(null);
    setForm(emptyForm(day));
    setError("");
    setIdeaSuggestion(null);
    setModalOpen(true);
  }

  function openEdit(post: VideoPost) {
    setEditing(post);
    setForm(formFromPost(post));
    setError("");
    setIdeaSuggestion(null);
    setDetail(null);
    setModalOpen(true);
    // Carrega o detalhe do pipeline (roteiro, cenas, vídeo final)
    fetch(`/api/video-posts/${post.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDetail(d))
      .catch(() => {});
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setDetail(null);
    setError("");
    setIdeaSuggestion(null);
  }

  /** Gera (ou melhora) o prompt via agente de IA; o usuário confirma antes. */
  async function generateIdea() {
    if (!form.title.trim()) {
      setError("Informe o título para gerar a ideia de prompt.");
      return;
    }
    setError("");
    setIdeaLoading(true);
    try {
      const res = await fetch("/api/video-posts/prompt-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          prompt: form.prompt.trim() || undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Erro ao gerar a ideia de prompt.");
        return;
      }
      setIdeaSuggestion(d.prompt);
    } finally {
      setIdeaLoading(false);
    }
  }

  /** "Enviar agora": antecipa o agendamento e dispara o pipeline na hora. */
  async function sendNow() {
    if (!editing) return;
    if (
      !confirm(
        "Enviar agora? O vídeo será gerado e enviado no servidor. Você pode fechar este modal — o status atualiza sozinho quando reabrir."
      )
    )
      return;
    setSendingNow(true);
    setError("");
    try {
      const res = await fetch(`/api/video-posts/${editing.id}/send-now`, {
        method: "POST",
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Erro ao enviar agora.");
        if (d.post) {
          setEditing(d.post);
          setForm(formFromPost(d.post));
        }
        return;
      }
      setEditing(d);
      setForm(formFromPost(d));
      setDetail(null);
      // Carrega o detalhe logo e o polling cuida do resto.
      fetch(`/api/video-posts/${d.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((full) => {
          if (full) setDetail(full);
        })
        .catch(() => {});
      load();
    } finally {
      setSendingNow(false);
    }
  }

  async function save() {
    setError("");
    if (!form.title.trim()) {
      setError("Informe o título.");
      return;
    }
    if (!form.prompt.trim()) {
      setError("Informe o prompt do roteiro.");
      return;
    }
    if (!form.accountName.trim()) {
      setError("Informe o nome da conta.");
      return;
    }
    if (
      !form.platformInstagram &&
      !form.platformYoutube &&
      !form.platformTiktok &&
      !form.platformKwai
    ) {
      setError("Selecione ao menos uma plataforma.");
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("Data ou horário inválido.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      prompt: form.prompt.trim(),
      accountName: form.accountName.trim(),
      scheduledAt: scheduledAt.toISOString(),
      platformInstagram: form.platformInstagram,
      platformYoutube: form.platformYoutube,
      platformTiktok: form.platformTiktok,
      platformKwai: form.platformKwai,
      autoSend: form.autoSend,
      voiceId: form.voiceId.trim() || null,
      format: form.format,
      resolution: form.resolution,
      style: form.style,
      status: "scheduled" as const,
    };

    setSaving(true);
    const res = await fetch(
      editing ? `/api/video-posts/${editing.id}` : "/api/video-posts",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao salvar.");
      return;
    }

    closeModal();
    load();
  }

  async function remove() {
    if (!editing) return;
    if (!confirm("Excluir esta postagem do calendário?")) return;
    await fetch(`/api/video-posts/${editing.id}`, { method: "DELETE" });
    closeModal();
    load();
  }

  const postsByDay = useMemo(() => {
    const map = new Map<string, VideoPost[]>();
    for (const post of posts) {
      const key = toDateInput(new Date(post.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(post);
      map.set(key, list);
    }
    return map;
  }, [posts]);

  const titleLabel = `${MONTHS[cursor.getMonth()]} de ${cursor.getFullYear()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Calendário de postagens</h1>
          <p className="mt-1 text-sm muted">
            Agende vídeos para Instagram, YouTube, TikTok e Kwai
          </p>
        </div>
        <button className="btn-primary" onClick={() => openCreate()}>
          <Plus size={16} /> Criar postagem
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Toolbar estilo Google Calendar */}
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5 [border-color:var(--border)]">
          <button
            className="btn-outline px-3 py-1.5 text-sm"
            onClick={() => setCursor(startOfMonth(new Date()))}
          >
            Hoje
          </button>
          <div className="flex items-center">
            <button
              className="btn-ghost px-2 py-1.5"
              aria-label="Mês anterior"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
                )
              }
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="btn-ghost px-2 py-1.5"
              aria-label="Próximo mês"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
                )
              }
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <h2 className="ml-1 text-lg font-medium capitalize">{titleLabel}</h2>
          {loading && (
            <span className="ml-auto text-xs muted">Carregando...</span>
          )}
        </div>

        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-7 border-b [border-color:var(--border)]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="border-r px-1 py-2 text-center text-xs font-medium uppercase tracking-wide muted last:border-r-0 [border-color:var(--border)]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grade do mês */}
        <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)]">
          {days.map((day) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const key = toDateInput(day);
            const dayPosts = postsByDay.get(key) ?? [];

            return (
              <div
                key={key}
                className={cn(
                  "group relative min-h-[100px] border-b border-r p-1 [border-color:var(--border)] [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-black/[0.02] dark:bg-white/[0.02]"
                )}
                onClick={() => openCreate(day)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openCreate(day);
                }}
              >
                <div className="mb-1 flex justify-center">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
                      !inMonth && "muted",
                      isToday && "bg-brand-600 font-semibold text-white"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      className={cn(
                        "block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white",
                        eventColor(post)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(post);
                      }}
                      title={`${post.title} · @${post.accountName}`}
                    >
                      <span className="opacity-90">{formatTime(post.scheduledAt)}</span>{" "}
                      {post.title}
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <button
                      type="button"
                      className="w-full px-1 text-left text-[11px] font-medium muted hover:text-[var(--text)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(dayPosts[3]);
                      }}
                    >
                      +{dayPosts.length - 3} mais
                    </button>
                  )}
                </div>
                <span className="pointer-events-none absolute bottom-1 right-1 opacity-0 transition group-hover:opacity-40">
                  <Plus size={14} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal criar/editar */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[8vh] sm:pt-[12vh]"
          onClick={closeModal}
        >
          <div
            className="card w-full max-w-lg animate-fade-in shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3.5 [border-color:var(--border)]">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {editing ? "Editar postagem" : "Nova postagem"}
                </h3>
                {editing && <StatusBadge status={editing.status} />}
              </div>
              <button className="btn-ghost px-2" onClick={closeModal} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {editing && (
                <PipelinePanel
                  post={editing}
                  detail={detail}
                  onRetry={sendNow}
                  retrying={sendingNow}
                />
              )}
              <div>
                <label className="label">Título</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex.: Bastidores do lançamento"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Conta</label>
                <input
                  className="input"
                  value={form.accountName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accountName: e.target.value }))
                  }
                  placeholder="Ex.: @lustosatech"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data</label>
                  <input
                    type="date"
                    className="input"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Horário</label>
                  <input
                    type="time"
                    className="input"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="label mb-0">Prompt do roteiro</label>
                  <button
                    type="button"
                    className="btn-outline px-2.5 py-1 text-xs"
                    onClick={generateIdea}
                    disabled={ideaLoading || !form.title.trim()}
                    title={
                      form.title.trim()
                        ? "A IA cria ou melhora o prompt a partir do título"
                        : "Preencha o título primeiro"
                    }
                  >
                    {ideaLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Wand2 size={13} />
                    )}
                    {form.prompt.trim()
                      ? "Melhorar meu prompt"
                      : "Gerar ideia de prompt"}
                  </button>
                </div>
                <textarea
                  className="input min-h-[120px]"
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder="Descreva o assunto do vídeo. Não precisa citar formato ou estilo — isso é escolhido abaixo."
                />
                {ideaSuggestion && (
                  <div className="mt-2 space-y-2 rounded-xl border border-brand-600/40 bg-brand-600/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                      <Wand2 size={13} /> Sugestão da IA
                    </p>
                    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-xs">
                      {ideaSuggestion}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary px-3 py-1.5 text-xs"
                        onClick={() => {
                          setForm((f) => ({ ...f, prompt: ideaSuggestion }));
                          setIdeaSuggestion(null);
                        }}
                      >
                        <Check size={13} /> Usar este prompt
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-3 py-1.5 text-xs"
                        onClick={() => setIdeaSuggestion(null)}
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-xl border p-3 [border-color:var(--border)]">
                <p className="text-sm font-semibold">Formato do vídeo</p>
                <div>
                  <label className="label">Orientação</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMAT_CHOICES.map((c) => (
                      <ChoiceCard
                        key={c.value}
                        active={form.format === c.value}
                        onSelect={() =>
                          setForm((f) => ({ ...f, format: c.value }))
                        }
                        icon={c.icon}
                        label={c.label}
                        hint={c.hint}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Qualidade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RESOLUTION_CHOICES.map((c) => (
                      <ChoiceCard
                        key={c.value}
                        active={form.resolution === c.value}
                        onSelect={() =>
                          setForm((f) => ({ ...f, resolution: c.value }))
                        }
                        label={c.label}
                        hint={c.hint}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Estilo do vídeo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_CHOICES.map((c) => (
                      <ChoiceCard
                        key={c.value}
                        active={form.style === c.value}
                        onSelect={() =>
                          setForm((f) => ({ ...f, style: c.value }))
                        }
                        icon={c.icon}
                        label={c.label}
                        hint={c.hint}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs muted">
                  Essas escolhas são adicionadas automaticamente ao prompt do
                  vídeo — no campo acima, descreva apenas o conteúdo.
                </p>
              </div>

              <div>
                <label className="label">Voz da narração (ElevenLabs)</label>
                {voicesConfigured && voices.length > 0 ? (
                  <select
                    className="input"
                    value={form.voiceId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, voiceId: e.target.value }))
                    }
                  >
                    <option value="">Padrão</option>
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                        {v.language ? ` (${v.language})` : ""}
                        {v.premade === false ? " — requer plano pago" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input font-mono"
                    value={form.voiceId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, voiceId: e.target.value }))
                    }
                    placeholder="Voice ID (vazio = voz padrão)"
                  />
                )}
              </div>

              <div>
                <label className="label">Plataformas</label>
                <div className="grid grid-cols-2 gap-2">
                  <PlatformToggle
                    active={form.platformInstagram}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        platformInstagram: !f.platformInstagram,
                      }))
                    }
                    color="border-[#e1306c] text-[#e1306c]"
                    activeClass="bg-[#e1306c] text-white border-[#e1306c]"
                    icon={<Instagram size={16} />}
                    label="Instagram"
                  />
                  <PlatformToggle
                    active={form.platformYoutube}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        platformYoutube: !f.platformYoutube,
                      }))
                    }
                    color="border-[#ff0000] text-[#ff0000]"
                    activeClass="bg-[#ff0000] text-white border-[#ff0000]"
                    icon={<Youtube size={16} />}
                    label="YouTube"
                  />
                  <PlatformToggle
                    active={form.platformTiktok}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        platformTiktok: !f.platformTiktok,
                      }))
                    }
                    color="border-[var(--text)] text-[var(--text)]"
                    activeClass="bg-[#111] text-white border-[#111] dark:bg-[#25f4ee] dark:text-black dark:border-[#25f4ee]"
                    icon={<TikTokIcon size={16} />}
                    label="TikTok"
                  />
                  <PlatformToggle
                    active={form.platformKwai}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        platformKwai: !f.platformKwai,
                      }))
                    }
                    color="border-[#ff4906] text-[#ff4906]"
                    activeClass="bg-[#ff4906] text-white border-[#ff4906]"
                    icon={<KwaiIcon size={16} />}
                    label="Kwai"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 [border-color:var(--border)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={form.autoSend}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, autoSend: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Send size={14} className="text-brand-600" />
                    Envio automático
                  </div>
                  <p className="text-xs muted">
                    Publica automaticamente no horário agendado
                  </p>
                </div>
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3.5 [border-color:var(--border)]">
              {editing ? (
                <div className="flex items-center gap-1">
                  <button className="btn-ghost text-red-500" onClick={remove}>
                    <Trash2 size={16} /> Excluir
                  </button>
                  <button
                    className="btn-outline"
                    onClick={sendNow}
                    disabled={
                      sendingNow || IN_PROGRESS_STATUSES.has(editing.status)
                    }
                    title="Gera e envia o vídeo imediatamente (bom para testar o fluxo)"
                  >
                    {sendingNow ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Zap size={16} />
                    )}
                    {IN_PROGRESS_STATUSES.has(editing.status)
                      ? "Processando..."
                      : "Enviar agora"}
                  </button>
                </div>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={save} disabled={saving}>
                  <Check size={16} /> {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status] ?? {
    label: status,
    className: "bg-black/10 dark:bg-white/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        info.className
      )}
    >
      {IN_PROGRESS_STATUSES.has(status) && (
        <Loader2 size={11} className="animate-spin" />
      )}
      {info.label}
    </span>
  );
}

function PipelinePanel({
  post,
  detail,
  onRetry,
  retrying,
}: {
  post: VideoPost;
  detail: VideoPostDetail | null;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const [showScript, setShowScript] = useState(false);

  const inProgress = IN_PROGRESS_STATUSES.has(post.status);
  const showPanel =
    inProgress ||
    post.status === "failed" ||
    post.status === "sent" ||
    post.status === "published" ||
    detail?.script ||
    detail?.finalVideoUrl ||
    post.finalVideoUrl;

  if (!showPanel) return null;

  const script = detail?.script;
  const finalVideoUrl = detail?.finalVideoUrl || post.finalVideoUrl;
  const errorMsg = detail?.error || post.error;

  // Para falha, marca etapas anteriores com base no que já existe.
  const failedAtIndex = (() => {
    if (post.status !== "failed") return -1;
    if (finalVideoUrl) return 4;
    if (script?.prompts?.some((p) => p.videoUrl)) return 2;
    if (script?.prompts?.length) return 1;
    if (script) return 0;
    return 0;
  })();

  return (
    <div className="space-y-3 rounded-xl border p-3 [border-color:var(--border)]">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Film size={15} className="text-brand-600" /> Pipeline do vídeo
        </p>
        <StatusBadge status={post.status} />
      </div>

      {inProgress && (
        <p className="rounded-lg bg-brand-600/5 px-3 py-2 text-xs text-brand-600">
          Processamento no servidor — pode fechar este modal. Ao reabrir, o
          status continua de onde parou. Esta tela atualiza sozinha a cada 3s.
        </p>
      )}

      <ol className="space-y-1.5">
        {PIPELINE_STEPS.map((step, i) => {
          let state: "done" | "current" | "pending" | "failed" = stepState(
            post.status,
            i
          );
          if (post.status === "failed") {
            if (i < failedAtIndex) state = "done";
            else if (i === failedAtIndex) state = "failed";
            else state = "pending";
          }
          return (
            <li
              key={step.id}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  state === "done" && "bg-emerald-500/15 text-emerald-600",
                  state === "current" && "bg-amber-500/15 text-amber-600",
                  state === "failed" && "bg-red-500/15 text-red-600",
                  state === "pending" && "bg-black/5 text-black/40 dark:bg-white/10 dark:text-white/40"
                )}
              >
                {state === "done" ? (
                  <Check size={11} />
                ) : state === "current" ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : state === "failed" ? (
                  "!"
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  state === "pending" && "muted",
                  state === "current" && "font-semibold text-amber-600",
                  state === "failed" && "font-semibold text-red-600",
                  state === "done" && "text-emerald-700 dark:text-emerald-400"
                )}
              >
                {step.label}
                {state === "current" && " — em andamento..."}
                {state === "failed" && " — falhou"}
              </span>
            </li>
          );
        })}
      </ol>

      {post.status === "failed" && (
        <div className="space-y-2">
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errorMsg ||
              "O processamento falhou sem mensagem. Verifique as chaves OPENAI/GEMINI/ELEVENLABS e o Azure Blob no App Service, e tente novamente."}
          </p>
          {onRetry && (
            <button
              type="button"
              className="btn-outline px-3 py-1.5 text-xs"
              onClick={onRetry}
              disabled={retrying}
            >
              {retrying ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Zap size={13} />
              )}
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {script && (
        <div className="space-y-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            onClick={() => setShowScript((v) => !v)}
          >
            <FileText size={13} />
            {showScript ? "Ocultar roteiro" : "Ver roteiro gerado"}
          </button>
          {showScript && (
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/5 p-3 text-xs dark:bg-white/5">
              {script.content}
            </pre>
          )}

          {script.prompts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium muted">
                Cenas ({script.prompts.length})
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {script.prompts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg bg-black/[0.03] px-2 py-1.5 text-xs dark:bg-white/[0.04]"
                  >
                    <span className="shrink-0 font-mono muted">#{p.sequence}</span>
                    <span className="min-w-0 flex-1 truncate" title={p.prompt}>
                      {p.prompt}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        p.status === "done"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : p.status === "failed"
                            ? "bg-red-500/15 text-red-600"
                            : "bg-amber-500/15 text-amber-600"
                      )}
                    >
                      {p.status === "done"
                        ? "pronta"
                        : p.status === "failed"
                          ? "falhou"
                          : "gerando"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {finalVideoUrl && (
        <a
          href={finalVideoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
        >
          <ExternalLink size={13} /> Ver vídeo final
        </a>
      )}
    </div>
  );
}

function ChoiceCard({
  active,
  onSelect,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition",
        active
          ? "border-brand-600 bg-brand-600/10 text-brand-600"
          : "[border-color:var(--border)] hover:bg-black/5 dark:hover:bg-white/5"
      )}
      aria-pressed={active}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className={cn("block text-xs", active ? "text-brand-600/80" : "muted")}>
          {hint}
        </span>
      </span>
    </button>
  );
}

function PlatformToggle({
  active,
  onToggle,
  color,
  activeClass,
  icon,
  label,
}: {
  active: boolean;
  onToggle: () => void;
  color: string;
  activeClass: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
        active ? activeClass : cn("bg-transparent hover:bg-black/5 dark:hover:bg-white/5", color)
      )}
    >
      {icon}
      {label}
    </button>
  );
}
