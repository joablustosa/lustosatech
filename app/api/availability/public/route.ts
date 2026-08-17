import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { generateOpenSlots, DAYS_AHEAD } from "@/lib/availability";

/**
 * Rota pública: horários livres futuros para a página de agendamento.
 * Os slots são gerados dinamicamente (seg–sex, 08:00–18:00, de 30 em 30 min)
 * e os que já foram reservados são removidos.
 */
export async function GET() {
  const now = new Date();
  const horizon = new Date(now.getTime() + (DAYS_AHEAD + 1) * 86400000);

  const booked = await prisma.availabilitySlot.findMany({
    where: {
      tenantId: DEFAULT_TENANT_ID,
      isBooked: true,
      startsAt: { gte: now, lte: horizon },
    },
    select: { startsAt: true },
  });

  const bookedIso = new Set(booked.map((b) => b.startsAt.toISOString()));
  const slots = generateOpenSlots(bookedIso, now);

  return NextResponse.json(slots);
}
