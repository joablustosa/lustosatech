import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewsForm } from "@/components/news-form";

export default function NewNewsPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/news"
        className="inline-flex items-center gap-1 text-sm muted hover:underline"
      >
        <ArrowLeft size={15} /> Voltar
      </Link>
      <h1 className="text-2xl font-bold">Nova notícia</h1>
      <NewsForm />
    </div>
  );
}
