/**
 * Geração dinâmica de horários de agendamento.
 *
 * Regras de negócio (fixas):
 *  - Segunda a sexta-feira (dias úteis).
 *  - Das 08:00 às 18:00 (horário de Brasília).
 *  - Slots de 30 em 30 minutos (último começa 17:30 e termina 18:00).
 *
 * Os horários são calculados na hora, sem precisar cadastrá-los um a um.
 * Quando um cliente agenda, criamos um AvailabilitySlot (isBooked = true)
 * apenas para aquele horário — é assim que o slot deixa de aparecer como livre.
 */

export const SLOT_MINUTES = 30;
export const START_HOUR = 8; // 08:00
export const END_HOUR = 18; // 18:00 (exclusivo: último slot 17:30–18:00)
export const DAYS_AHEAD = 21; // janela de horários futuros oferecidos

// Brasil não adota horário de verão desde 2019: offset fixo UTC-3.
const BR_OFFSET_MIN = 180;

export interface OpenSlot {
  startsAt: string; // ISO
  endsAt: string; // ISO
}

/** Componentes de "relógio de parede" em horário de Brasília para um instante. */
function brParts(instant: Date) {
  const s = new Date(instant.getTime() - BR_OFFSET_MIN * 60000);
  return {
    y: s.getUTCFullYear(),
    mo: s.getUTCMonth(),
    d: s.getUTCDate(),
    h: s.getUTCHours(),
    mi: s.getUTCMinutes(),
    dow: s.getUTCDay(), // 0 = domingo ... 6 = sábado
  };
}

/** Converte uma hora local de Brasília (parede) no instante UTC correspondente. */
function brToUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  return new Date(Date.UTC(y, mo, d, h, mi) + BR_OFFSET_MIN * 60000);
}

/**
 * Gera todos os horários livres futuros dentro da janela configurada,
 * excluindo os que já estão reservados (`bookedIso`).
 */
export function generateOpenSlots(
  bookedIso: Set<string> = new Set(),
  now: Date = new Date()
): OpenSlot[] {
  const slots: OpenSlot[] = [];
  const today = brParts(now);
  // Meia-noite de hoje (Brasília) como instante de referência.
  const base = brToUtc(today.y, today.mo, today.d, 0, 0);

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const dayInstant = new Date(base.getTime() + i * 86400000);
    const dp = brParts(dayInstant);
    if (dp.dow === 0 || dp.dow === 6) continue; // pula fim de semana

    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let mi = 0; mi < 60; mi += SLOT_MINUTES) {
        const start = brToUtc(dp.y, dp.mo, dp.d, h, mi);
        if (start.getTime() <= now.getTime()) continue; // só futuros
        const iso = start.toISOString();
        if (bookedIso.has(iso)) continue; // já reservado
        const end = new Date(start.getTime() + SLOT_MINUTES * 60000);
        slots.push({ startsAt: iso, endsAt: end.toISOString() });
      }
    }
  }
  return slots;
}

/**
 * Valida se um `startsAt` recebido do cliente é um horário legítimo:
 * dia útil, dentro de 08:00–18:00, alinhado à grade de 30 min, no futuro
 * e dentro da janela oferecida. Protege contra agendamento fora das regras.
 */
export function isValidSlotStart(start: Date, now: Date = new Date()): boolean {
  if (isNaN(start.getTime())) return false;
  if (start.getTime() <= now.getTime()) return false;

  const p = brParts(start);
  if (p.dow === 0 || p.dow === 6) return false;
  if (p.h < START_HOUR || p.h >= END_HOUR) return false;
  if (p.mi % SLOT_MINUTES !== 0) return false;

  // Rejeita segundos/milissegundos fora da grade exata.
  if (brToUtc(p.y, p.mo, p.d, p.h, p.mi).getTime() !== start.getTime()) {
    return false;
  }

  // Dentro da janela de dias oferecida.
  const maxAhead = now.getTime() + DAYS_AHEAD * 86400000;
  if (start.getTime() > maxAhead) return false;

  return true;
}

/** Fim do slot a partir do início. */
export function slotEnd(start: Date): Date {
  return new Date(start.getTime() + SLOT_MINUTES * 60000);
}
