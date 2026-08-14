import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

function parseYearMonth(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));
  const now = new Date();
  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : now.getFullYear(),
    month:
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : now.getMonth() + 1,
  };
}

const upsertSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  targetProjects: z.number().int().min(0),
  targetRevenue: z.number().min(0),
});

/** Meta do mês + progresso (projetos ativos/concluídos no mês). */
export async function GET(req: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { year, month } = parseYearMonth(req);
  const { start, end } = monthRange(year, month);

  const [goal, projects] = await Promise.all([
    prisma.monthlyGoal.findUnique({
      where: {
        tenantId_year_month: { tenantId: s.tenantId, year, month },
      },
    }),
    prisma.project.findMany({
      where: {
        tenantId: s.tenantId,
        status: { not: "cancelado" },
        referenceDate: { gte: start, lt: end },
      },
      orderBy: { referenceDate: "desc" },
    }),
  ]);

  const achievedProjects = projects.length;
  const achievedRevenue = projects.reduce(
    (sum, p) => sum + Number(p.value),
    0
  );
  const targetProjects = goal?.targetProjects ?? 0;
  const targetRevenue = goal ? Number(goal.targetRevenue) : 0;

  return NextResponse.json({
    year,
    month,
    goal: goal
      ? {
          id: goal.id,
          targetProjects,
          targetRevenue,
        }
      : null,
    progress: {
      achievedProjects,
      achievedRevenue,
      projectsPct:
        targetProjects > 0
          ? Math.min(100, Math.round((achievedProjects / targetProjects) * 100))
          : 0,
      revenuePct:
        targetRevenue > 0
          ? Math.min(100, Math.round((achievedRevenue / targetRevenue) * 100))
          : 0,
      projectsReached: targetProjects > 0 && achievedProjects >= targetProjects,
      revenueReached: targetRevenue > 0 && achievedRevenue >= targetRevenue,
    },
    projects: projects.map((p) => ({
      ...p,
      value: Number(p.value),
    })),
  });
}

/** Cria ou atualiza a meta do mês. */
export async function PUT(req: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { year, month, targetProjects, targetRevenue } = parsed.data;
  const goal = await prisma.monthlyGoal.upsert({
    where: {
      tenantId_year_month: { tenantId: s.tenantId, year, month },
    },
    update: {
      targetProjects,
      targetRevenue: new Prisma.Decimal(targetRevenue),
    },
    create: {
      tenantId: s.tenantId,
      year,
      month,
      targetProjects,
      targetRevenue: new Prisma.Decimal(targetRevenue),
    },
  });

  return NextResponse.json({
    id: goal.id,
    year: goal.year,
    month: goal.month,
    targetProjects: goal.targetProjects,
    targetRevenue: Number(goal.targetRevenue),
  });
}
