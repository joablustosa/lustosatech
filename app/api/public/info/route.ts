import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSetting, getBaseUrl } from "@/lib/settings";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { generateOpenSlots, DAYS_AHEAD } from "@/lib/availability";

/** Informações públicas da empresa (landing, agendamento). */
export async function GET() {
  const now = new Date();
  const horizon = new Date(now.getTime() + (DAYS_AHEAD + 1) * 86400000);

  const [companyName, bookingBaseUrl, docCount, booked] = await Promise.all([
    getSetting("companyName"),
    getBaseUrl(),
    prisma.document.count({
      where: { tenantId: DEFAULT_TENANT_ID, enabled: true },
    }),
    prisma.availabilitySlot.findMany({
      where: {
        tenantId: DEFAULT_TENANT_ID,
        isBooked: true,
        startsAt: { gte: now, lte: horizon },
      },
      select: { startsAt: true },
    }),
  ]);

  const bookedIso = new Set(booked.map((b) => b.startsAt.toISOString()));
  const openSlots = generateOpenSlots(bookedIso, now).length;

  return NextResponse.json({
    companyName: companyName || "Lustosa Tech",
    bookingBaseUrl,
    docCount,
    openSlots,
  });
}
