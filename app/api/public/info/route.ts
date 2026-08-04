import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSetting, getBaseUrl } from "@/lib/settings";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

/** Informações públicas da empresa (landing, agendamento). */
export async function GET() {
  const [companyName, bookingBaseUrl, docCount, openSlots] = await Promise.all([
    getSetting("companyName"),
    getBaseUrl(),
    prisma.document.count({
      where: { tenantId: DEFAULT_TENANT_ID, enabled: true },
    }),
    prisma.availabilitySlot.count({
      where: {
        tenantId: DEFAULT_TENANT_ID,
        isBooked: false,
        startsAt: { gte: new Date() },
      },
    }),
  ]);

  return NextResponse.json({
    companyName: companyName || "Lustosa Tech",
    bookingBaseUrl,
    docCount,
    openSlots,
  });
}
