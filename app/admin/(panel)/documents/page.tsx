"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Plus,
  Check,
  X,
  Power,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Doc {
  id: string;
  title: string;
  filename: string | null;
  content: string;
  enabled: boolean;
  createdAt: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/documents");
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Se for um único arquivo, preenche o formulário; se vários, importa em lote.
    if (files.length === 1) {
      const f = files[0];
      const text = await f.text();
      setContent(text);
      setFilename(f.name);
      if (!title) setTitle(f.name.replace(/\.md$/i, ""));
      setShowForm(true);
      return;
    }
    for (const f of Array.from(files)) {
      const text = await f.text();
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: f.name.replace(/\.md$/i, ""),
          filename: f.name,
          content: text,
        }),
      });
    }
    load();
  }

  async function save() {
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("Preencha título e conteúdo.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, filename }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao salvar.");
      return;
    }
    setTitle("");
    setContent("");
    setFilename(undefined);
    setShowForm(false);
    load();
  }

  async function toggle(doc: Doc) {
    await fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !doc.enabled }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este documento?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="mt-1 text-sm muted">
            Conhecimento que a IA usa para responder sobre a empresa
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-outline"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} /> Importar .md
          </button>
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={16} /> Novo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {showForm && (
        <div className="card space-y-4 p-6">
          <div>
            <label className="label">Título</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Política de preços"
            />
          </div>
          <div>
            <label className="label">Conteúdo (Markdown)</label>
            <textarea
              className="input min-h-[220px] font-mono text-xs"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o conteúdo em markdown..."
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowForm(false)}>
              <X size={16} /> Cancelar
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              <Check size={16} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm muted">Carregando...</p>
      ) : docs.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center">
          <FileText className="muted" size={32} />
          <p className="font-medium">Nenhum documento ainda</p>
          <p className="text-sm muted">
            Importe seus arquivos .md ou crie um novo para a IA aprender sobre
            sua empresa.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="card flex items-start justify-between gap-4 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-brand-600" />
                  <h3 className="truncate font-semibold">{doc.title}</h3>
                  {!doc.enabled && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs muted dark:bg-white/10">
                      desativado
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm muted">
                  {doc.content.slice(0, 180)}
                </p>
                <p className="mt-1 text-xs muted">
                  {formatDateTime(doc.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  className="btn-ghost px-2"
                  title={doc.enabled ? "Desativar" : "Ativar"}
                  onClick={() => toggle(doc)}
                >
                  <Power
                    size={16}
                    className={doc.enabled ? "text-brand-600" : "muted"}
                  />
                </button>
                <button
                  className="btn-ghost px-2 text-red-500"
                  title="Excluir"
                  onClick={() => remove(doc.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
