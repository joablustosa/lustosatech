import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

const createSchema = z.object({
  startsAt: z.string(), // ISO
  durationMin: z.number().int().positive().max(480).default(30),
});

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const slots = await prisma.availabilitySlot.findMany({
    orderBy: { startsAt: "asc" },
    include: { meeting: true },
  });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const startsAt = new Date(parsed.data.startsAt);
  if (isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }
  const endsAt = new Date(startsAt.getTime() + parsed.data.durationMin * 60000);

  const slot = await prisma.availabilitySlot.create({
    data: { startsAt, endsAt },
  });
  return NextResponse.json(slot, { status: 201 });
}
