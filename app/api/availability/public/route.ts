import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Rota pública: lista horários livres futuros para a página de agendamento. */
export async function GET() {
  const slots = await prisma.availabilitySlot.findMany({
    where: { isBooked: false, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    select: { id: true, startsAt: true, endsAt: true },
  });
  return NextResponse.json(slots);
}
