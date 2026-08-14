"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Target,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FolderKanban,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  clientName: string | null;
  value: number;
  status: string;
  referenceDate: string;
  notes: string | null;
}

interface Dashboard {
  year: number;
  month: number;
  goal: { id: string; targetProjects: number; targetRevenue: number } | null;
  progress: {
    achievedProjects: number;
    achievedRevenue: number;
    projectsPct: number;
    revenuePct: number;
    projectsReached: boolean;
    revenueReached: boolean;
  };
  projects: Project[];
}

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function ProjectsPage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const [targetProjects, setTargetProjects] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalMsg, setGoalMsg] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("ativo");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/monthly-goals?year=${year}&month=${month}`);
    if (res.ok) {
      const json = (await res.json()) as Dashboard;
      setData(json);
      setTargetProjects(String(json.goal?.targetProjects ?? ""));
      setTargetRevenue(
        json.goal ? String(json.goal.targetRevenue) : ""
      );
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    setGoalMsg("");
    setSavingGoal(true);
    const res = await fetch("/api/monthly-goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        month,
        targetProjects: Number(targetProjects) || 0,
        targetRevenue: Number(String(targetRevenue).replace(",", ".")) || 0,
      }),
    });
    setSavingGoal(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setGoalMsg(d.error || "Erro ao salvar meta.");
      return;
    }
    setGoalMsg("Meta salva!");
    load();
  }

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Informe o nome do projeto.");
      return;
    }
    setSaving(true);
    // Atribui o projeto ao mês selecionado (dia 15 como referência estável)
    const referenceDate = new Date(year, month - 1, 15, 12, 0, 0).toISOString();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        clientName: clientName.trim() || null,
        value: Number(String(value).replace(",", ".")) || 0,
        status,
        referenceDate,
        notes: notes.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao cadastrar projeto.");
      return;
    }
    setName("");
    setClientName("");
    setValue("");
    setStatus("ativo");
    setNotes("");
    setShowForm(false);
    load();
  }

  async function updateStatus(id: string, next: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este projeto?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  const progress = data?.progress;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projetos e metas</h1>
          <p className="mt-1 text-sm muted">
            Defina metas mensais de quantidade e faturamento; os projetos
            cadastrados alimentam o progresso
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline px-2 py-2"
            onClick={() => shiftMonth(-1)}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-semibold">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            type="button"
            className="btn-outline px-2 py-2"
            onClick={() => shiftMonth(1)}
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm muted">Carregando...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ProgressCard
              icon={<FolderKanban size={20} />}
              title="Meta de projetos"
              achieved={progress?.achievedProjects ?? 0}
              target={data?.goal?.targetProjects ?? 0}
              pct={progress?.projectsPct ?? 0}
              reached={progress?.projectsReached ?? false}
              formatValue={(n) => String(n)}
              unit="projetos"
            />
            <ProgressCard
              icon={<DollarSign size={20} />}
              title="Meta de faturamento"
              achieved={progress?.achievedRevenue ?? 0}
              target={data?.goal?.targetRevenue ?? 0}
              pct={progress?.revenuePct ?? 0}
              reached={progress?.revenueReached ?? false}
              formatValue={formatCurrency}
            />
          </div>

          <section className="card space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Target size={18} className="text-brand-600" />
              Meta de {MONTHS[month - 1]} / {year}
            </h2>
            <form
              onSubmit={saveGoal}
              className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <div>
                <label className="label">Quantidade de projetos</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={targetProjects}
                  onChange={(e) => setTargetProjects(e.target.value)}
                  placeholder="ex.: 5"
                />
              </div>
              <div>
                <label className="label">Faturamento (R$)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="input"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  placeholder="ex.: 50000"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={savingGoal}
              >
                <Save size={16} />
                {savingGoal ? "Salvando..." : "Salvar meta"}
              </button>
            </form>
            {goalMsg && (
              <p
                className={`text-sm ${
                  goalMsg.includes("Erro") ? "text-red-500" : "text-brand-600"
                }`}
              >
                {goalMsg}
              </p>
            )}
          </section>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Projetos do mês ({data?.projects.length ?? 0})
            </h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Fechar" : "Adicionar projeto"}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={addProject}
              className="card space-y-4 p-6 animate-fade-in"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Nome do projeto *</label>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex.: Site institucional"
                  />
                </div>
                <div>
                  <label className="label">Cliente</label>
                  <input
                    className="input"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea
                  className="input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes opcionais"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <p className="text-xs muted">
                O projeto será contabilizado em {MONTHS[month - 1]} / {year}.
                Projetos cancelados não entram no progresso da meta.
              </p>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Plus size={16} />
                {saving ? "Salvando..." : "Cadastrar projeto"}
              </button>
            </form>
          )}

          {!data?.projects.length ? (
            <div className="card p-10 text-center">
              <FolderKanban className="mx-auto mb-3 muted" size={32} />
              <p className="font-medium">Nenhum projeto neste mês</p>
              <p className="mt-1 text-sm muted">
                Adicione projetos para acompanhar o avanço das metas.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.projects.map((p) => (
                <li
                  key={p.id}
                  className="card flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm muted">
                      {p.clientName || "Sem cliente"} ·{" "}
                      {formatCurrency(p.value)} ·{" "}
                      {formatDateTime(p.referenceDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="input w-auto py-1.5 text-sm"
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                    >
                      <option value="ativo">{STATUS_LABEL.ativo}</option>
                      <option value="concluido">{STATUS_LABEL.concluido}</option>
                      <option value="cancelado">{STATUS_LABEL.cancelado}</option>
                    </select>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1.5 text-red-500"
                      onClick={() => remove(p.id)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ProgressCard({
  icon,
  title,
  achieved,
  target,
  pct,
  reached,
  formatValue,
  unit,
}: {
  icon: React.ReactNode;
  title: string;
  achieved: number;
  target: number;
  pct: number;
  reached: boolean;
  formatValue: (n: number) => string;
  unit?: string;
}) {
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            {icon}
          </span>
          {title}
        </div>
        {reached && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <CheckCircle2 size={14} /> Meta alcançada
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">
        {formatValue(achieved)}
        <span className="text-base font-normal muted">
          {" "}
          / {target > 0 ? formatValue(target) : "—"}
          {unit ? ` ${unit}` : ""}
        </span>
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            reached ? "bg-emerald-500" : "bg-brand-600"
          }`}
          style={{ width: `${target > 0 ? pct : 0}%` }}
        />
      </div>
      <p className="text-xs muted">
        {target > 0
          ? `${pct}% da meta`
          : "Defina a meta do mês para acompanhar o progresso"}
      </p>
    </div>
  );
}
