import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSetting, getBaseUrl } from "@/lib/settings";

/** Informações públicas da empresa (landing, agendamento). */
export async function GET() {
  const [companyName, bookingBaseUrl, docCount, openSlots] = await Promise.all([
    getSetting("companyName"),
    getBaseUrl(),
    prisma.document.count({ where: { enabled: true } }),
    prisma.availabilitySlot.count({
      where: { isBooked: false, startsAt: { gte: new Date() } },
    }),
  ]);

  return NextResponse.json({
    companyName: companyName || "Lustosa Tech",
    bookingBaseUrl,
    docCount,
    openSlots,
  });
}
