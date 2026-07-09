"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock,
  MessageCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
}

interface PublicInfo {
  companyName: string;
  openSlots: number;
}

export default function AgendarPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [companyName, setCompanyName] = useState("Lustosa Tech");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Slot | null>(null);

  async function load() {
    setLoading(true);
    const [slotsRes, infoRes] = await Promise.all([
      fetch("/api/availability/public"),
      fetch("/api/public/info"),
    ]);
    if (slotsRes.ok) setSlots(await slotsRes.json());
    if (infoRes.ok) {
      const info = (await infoRes.json()) as PublicInfo;
      setCompanyName(info.companyName);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const day = formatDate(s.startsAt);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    }
    return Array.from(map.entries());
  }, [slots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: selected.id,
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        notes,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Não foi possível agendar.");
      load();
      setSelected(null);
      return;
    }
    setDone(selected);
  }

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="card max-w-md p-8 text-center animate-fade-in">
          <CheckCircle2 className="mx-auto mb-4 text-brand-600" size={48} />
          <h1 className="text-xl font-bold">Reunião confirmada!</h1>
          <p className="mt-2 muted">
            {name}, sua reunião está marcada para
          </p>
          <p className="mt-1 text-lg font-semibold text-brand-600">
            {formatDate(done.startsAt)} às {formatTime(done.startsAt)}
          </p>
          <p className="mt-4 text-sm muted">
            Enviaremos os detalhes em breve. Até lá! 👋
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white">
          <MessageCircle size={26} />
        </span>
        <h1 className="text-2xl font-bold">Agende sua reunião</h1>
        <p className="mt-1 muted">
          Escolha o melhor horário para conversar com a equipe da {companyName}
        </p>
      </header>

      {loading ? (
        <p className="text-center text-sm muted">Carregando horários...</p>
      ) : slots.length === 0 ? (
        <div className="card p-10 text-center">
          <Clock className="mx-auto mb-3 muted" size={32} />
          <p className="font-medium">Nenhum horário disponível no momento</p>
          <p className="mt-1 text-sm muted">
            Por favor, tente novamente mais tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-4">
            {grouped.map(([day, daySlots]) => (
              <div key={day} className="card p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold capitalize">
                  <CalendarCheck size={16} className="text-brand-600" />
                  {day}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => {
                    const active = selected?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "[border-color:var(--border)] hover:border-brand-400"
                        }`}
                      >
                        {formatTime(s.startsAt)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {selected && (
            <form onSubmit={submit} className="card space-y-4 p-6 animate-fade-in">
              <p className="text-sm">
                Horário escolhido:{" "}
                <span className="font-semibold text-brand-600">
                  {formatDate(selected.startsAt)} às{" "}
                  {formatTime(selected.startsAt)}
                </span>
              </p>
              <div>
                <label className="label">Seu nome *</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="5511999999999"
                  />
                </div>
              </div>
              <div>
                <label className="label">Assunto (opcional)</label>
                <textarea
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sobre o que você quer conversar?"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                className="btn-primary w-full py-3"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CalendarCheck size={18} />
                )}
                Confirmar reunião
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}
