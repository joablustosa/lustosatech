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
  status: string;
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
};

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
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = useMemo(() => new Date(), []);

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

  function openCreate(day?: Date) {
    setEditing(null);
    setForm(emptyForm(day));
    setError("");
    setModalOpen(true);
  }

  function openEdit(post: VideoPost) {
    setEditing(post);
    setForm(formFromPost(post));
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setError("");
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
              <h3 className="text-lg font-semibold">
                {editing ? "Editar postagem" : "Nova postagem"}
              </h3>
              <button className="btn-ghost px-2" onClick={closeModal} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
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
                <label className="label">Prompt do roteiro</label>
                <textarea
                  className="input min-h-[120px]"
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder="Descreva o roteiro ou o prompt para gerar o vídeo..."
                />
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

            <div className="flex items-center justify-between gap-2 border-t px-5 py-3.5 [border-color:var(--border)]">
              {editing ? (
                <button className="btn-ghost text-red-500" onClick={remove}>
                  <Trash2 size={16} /> Excluir
                </button>
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
