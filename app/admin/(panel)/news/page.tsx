"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, Plus, Pencil, Trash2, Star, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface News {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  featured: boolean;
  coverImageUrl: string | null;
  publishedAt: string;
}

export default function NewsAdminPage() {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/news?all=1&limit=100");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Excluir esta notícia?")) return;
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notícias</h1>
          <p className="mt-1 text-sm muted">Portal de notícias de I.A.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="btn-outline">
            <ExternalLink size={16} /> Ver portal
          </Link>
          <Link href="/admin/news/new" className="btn-primary">
            <Plus size={16} /> Nova notícia
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm muted">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center">
          <Newspaper className="muted" size={32} />
          <p className="font-medium">Nenhuma notícia ainda</p>
          <p className="text-sm muted">
            Crie a primeira ou publique via API com seus agentes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className="card flex items-center gap-4 p-3 pr-4"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
                {n.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    {n.category}
                  </span>
                  {n.featured && (
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                  )}
                  {n.status === "draft" && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs muted dark:bg-white/10">
                      rascunho
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate font-semibold">{n.title}</p>
                <p className="text-xs muted">{formatDateTime(n.publishedAt)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/noticias/${n.slug}`}
                  target="_blank"
                  className="btn-ghost px-2"
                  title="Abrir"
                >
                  <ExternalLink size={16} />
                </Link>
                <Link
                  href={`/admin/news/${n.id}/edit`}
                  className="btn-ghost px-2"
                  title="Editar"
                >
                  <Pencil size={16} />
                </Link>
                <button
                  className="btn-ghost px-2 text-red-500"
                  title="Excluir"
                  onClick={() => remove(n.id)}
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
