"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Meeting {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  notes: string | null;
  status: string;
  slot: { startsAt: string; endsAt: string };
}

export default function AgendamentosPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/meetings");
    if (res.ok) setMeetings(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const now = Date.now();
  const upcoming = meetings.filter((m) => new Date(m.slot.startsAt).getTime() >= now);
  const past = meetings.filter((m) => new Date(m.slot.startsAt).getTime() < now);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <p className="mt-1 text-sm muted">
          Reuniões marcadas pelos clientes no portal (seg–sex, 08:00–18:00)
        </p>
      </div>

      {loading ? (
        <p className="text-sm muted">Carregando...</p>
      ) : meetings.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-10 text-center">
          <CalendarClock className="muted" size={28} />
          <p className="text-sm muted">Nenhum agendamento ainda.</p>
        </div>
      ) : (
        <>
          <Section
            title={`PRÓXIMOS (${upcoming.length})`}
            meetings={upcoming}
            empty="Nenhum agendamento futuro."
          />
          {past.length > 0 && (
            <Section
              title={`ANTERIORES (${past.length})`}
              meetings={past}
              faded
            />
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  meetings,
  empty,
  faded,
}: {
  title: string;
  meetings: Meeting[];
  empty?: string;
  faded?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold muted">{title}</h2>
      {meetings.length === 0 ? (
        <p className="text-sm muted">{empty}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {meetings.map((m) => (
            <div
              key={m.id}
              className={`card p-4 ${faded ? "opacity-70" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  <CalendarCheck size={16} className="text-brand-600" />
                  {m.clientName}
                </span>
                <span className="text-sm font-semibold text-brand-600">
                  {formatDateTime(m.slot.startsAt)}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm muted">
                {m.clientPhone && (
                  <p className="flex items-center gap-2">
                    <Phone size={13} /> {m.clientPhone}
                  </p>
                )}
                {m.clientEmail && (
                  <p className="flex items-center gap-2">
                    <Mail size={13} /> {m.clientEmail}
                  </p>
                )}
                {m.notes && (
                  <p className="flex items-start gap-2">
                    <MessageSquare size={13} className="mt-0.5 shrink-0" />
                    {m.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
