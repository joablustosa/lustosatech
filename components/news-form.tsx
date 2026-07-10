"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Upload, Image as ImageIcon, Film, X } from "lucide-react";
import { NEWS_CATEGORIES } from "@/lib/news-constants";

export interface NewsData {
  id?: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  mediaType: string;
  mediaUrl?: string | null;
  author?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string | null;
  featured: boolean;
  status: string;
  publishedAt?: string;
}

const empty: NewsData = {
  title: "",
  category: "Novidades",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  mediaType: "image",
  mediaUrl: "",
  author: "",
  source: "",
  sourceUrl: "",
  tags: "",
  featured: false,
  status: "published",
};

export function NewsForm({ initial }: { initial?: NewsData }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [data, setData] = useState<NewsData>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "media" | null>(null);
  const [error, setError] = useState("");

  function set<K extends keyof NewsData>(key: K, value: NewsData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function upload(file: File, target: "cover" | "media") {
    setError("");
    setUploading(target);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/news/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha no upload");
      if (target === "cover") {
        set("coverImageUrl", json.url);
      } else {
        set("mediaUrl", json.url);
        set("mediaType", json.mediaType);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setError("");
    if (!data.title.trim() || !data.excerpt.trim() || !data.content.trim()) {
      setError("Preencha título, resumo e conteúdo.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        coverImageUrl: data.coverImageUrl || undefined,
        mediaUrl: data.mediaUrl || undefined,
        sourceUrl: data.sourceUrl || undefined,
      };
      const res = await fetch(
        isEdit ? `/api/news/${initial!.id}` : "/api/news",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao salvar");
      router.push("/admin/news");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Coluna principal */}
        <div className="space-y-4">
          <div className="card space-y-4 p-6">
            <div>
              <label className="label">Título *</label>
              <input
                className="input text-lg"
                value={data.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Título da notícia"
              />
            </div>
            <div>
              <label className="label">Resumo * (aparece nos cards)</label>
              <textarea
                className="input min-h-[70px]"
                value={data.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Uma ou duas frases resumindo a notícia"
              />
            </div>
            <div>
              <label className="label">Conteúdo * (Markdown)</label>
              <textarea
                className="input min-h-[320px] font-mono text-xs"
                value={data.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="## Subtítulo\n\nCorpo da matéria em markdown..."
              />
            </div>
          </div>
        </div>

        {/* Barra lateral */}
        <div className="space-y-4">
          <div className="card space-y-4 p-5">
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={data.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={data.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="published">Publicada</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Destaque na home
            </label>
          </div>

          {/* Imagem de capa */}
          <div className="card space-y-3 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ImageIcon size={16} className="text-brand-600" /> Imagem de capa
            </p>
            {data.coverImageUrl ? (
              <div className="relative">
                <img
                  src={data.coverImageUrl}
                  alt="capa"
                  className="w-full rounded-xl object-cover"
                />
                <button
                  onClick={() => set("coverImageUrl", "")}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="btn-outline w-full cursor-pointer justify-center">
                {uploading === "cover" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Enviar imagem
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && upload(e.target.files[0], "cover")
                  }
                />
              </label>
            )}
          </div>

          {/* Mídia (imagem ou vídeo) */}
          <div className="card space-y-3 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Film size={16} className="text-brand-600" /> Mídia (imagem ou vídeo)
            </p>
            {data.mediaUrl ? (
              <div className="relative">
                {data.mediaType === "video" ? (
                  <video src={data.mediaUrl} controls className="w-full rounded-xl" />
                ) : (
                  <img src={data.mediaUrl} alt="mídia" className="w-full rounded-xl" />
                )}
                <button
                  onClick={() => set("mediaUrl", "")}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="btn-outline w-full cursor-pointer justify-center">
                {uploading === "media" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Enviar imagem/vídeo
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={(e) =>
                    e.target.files?.[0] && upload(e.target.files[0], "media")
                  }
                />
              </label>
            )}
          </div>

          <div className="card space-y-3 p-5">
            <div>
              <label className="label">Autor</label>
              <input
                className="input"
                value={data.author || ""}
                onChange={(e) => set("author", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fonte</label>
              <input
                className="input"
                value={data.source || ""}
                onChange={(e) => set("source", e.target.value)}
                placeholder="Ex.: OpenAI Blog"
              />
            </div>
            <div>
              <label className="label">Link da fonte</label>
              <input
                className="input"
                value={data.sourceUrl || ""}
                onChange={(e) => set("sourceUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Tags (separadas por vírgula)</label>
              <input
                className="input"
                value={data.tags || ""}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="ia, llm, openai"
              />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={() => router.push("/admin/news")}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? "Salvar alterações" : "Publicar notícia"}
        </button>
      </div>
    </div>
  );
}
