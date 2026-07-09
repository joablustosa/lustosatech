"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2, Lock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
  meeting: { clientName: string } | null;
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/availability");
    if (res.ok) setSlots(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    setError("");
    if (!startsAt) {
      setError("Escolha data e hora.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: new Date(startsAt).toISOString(),
        durationMin: duration,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao criar horário.");
      return;
    }
    setStartsAt("");
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Não foi possível remover.");
      return;
    }
    load();
  }

  const free = slots.filter((s) => !s.isBooked);
  const booked = slots.filter((s) => s.isBooked);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Horários disponíveis</h1>
        <p className="mt-1 text-sm muted">
          Defina os horários que o cliente pode escolher na página de agendamento
        </p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-6">
        <div className="flex-1">
          <label className="label">Data e hora</label>
          <input
            type="datetime-local"
            className="input"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="w-32">
          <label className="label">Duração (min)</label>
          <input
            type="number"
            min={15}
            step={15}
            className="input"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
        <button className="btn-primary" onClick={add} disabled={saving}>
          <Plus size={16} /> Adicionar
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm muted">Carregando...</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold muted">
              LIVRES ({free.length})
            </h2>
            {free.length === 0 ? (
              <div className="card grid place-items-center gap-2 p-8 text-center">
                <CalendarClock className="muted" size={28} />
                <p className="text-sm muted">Nenhum horário livre.</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {free.map((s) => (
                  <div
                    key={s.id}
                    className="card flex items-center justify-between p-4"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <CalendarClock size={16} className="text-brand-600" />
                      {formatDateTime(s.startsAt)}
                    </span>
                    <button
                      className="btn-ghost px-2 text-red-500"
                      onClick={() => remove(s.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {booked.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold muted">
                RESERVADOS ({booked.length})
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {booked.map((s) => (
                  <div
                    key={s.id}
                    className="card flex items-center justify-between p-4 opacity-80"
                  >
                    <div>
                      <span className="flex items-center gap-2 font-medium">
                        <Lock size={15} className="muted" />
                        {formatDateTime(s.startsAt)}
                      </span>
                      {s.meeting && (
                        <span className="ml-6 text-sm muted">
                          {s.meeting.clientName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
