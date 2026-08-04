import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

/** Rota pública: lista horários livres futuros para a página de agendamento. */
export async function GET() {
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      tenantId: DEFAULT_TENANT_ID,
      isBooked: false,
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, startsAt: true, endsAt: true },
  });
  return NextResponse.json(slots);
}
