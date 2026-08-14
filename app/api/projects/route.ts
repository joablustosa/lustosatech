import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  clientName: z.string().optional().nullable(),
  value: z.number().min(0, "Valor inválido"),
  status: z.enum(["ativo", "concluido", "cancelado"]).optional(),
  referenceDate: z.string().datetime().or(z.string().min(1)).optional(),
  notes: z.string().optional().nullable(),
});

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const yearParam = req.nextUrl.searchParams.get("year");
  const monthParam = req.nextUrl.searchParams.get("month");

  const where: Prisma.ProjectWhereInput = { tenantId: s.tenantId };

  if (yearParam && monthParam) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12
    ) {
      const { start, end } = monthRange(year, month);
      where.referenceDate = { gte: start, lt: end };
    }
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { referenceDate: "desc" },
  });

  return NextResponse.json(
    projects.map((p) => ({ ...p, value: Number(p.value) }))
  );
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, clientName, value, status, referenceDate, notes } = parsed.data;
  const project = await prisma.project.create({
    data: {
      tenantId: s.tenantId,
      name,
      clientName: clientName || null,
      value: new Prisma.Decimal(value),
      status: status || "ativo",
      referenceDate: referenceDate ? new Date(referenceDate) : new Date(),
      notes: notes || null,
    },
  });

  return NextResponse.json(
    { ...project, value: Number(project.value) },
    { status: 201 }
  );
}
