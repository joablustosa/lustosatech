import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  clientName: z.string().optional().nullable(),
  value: z.number().min(0).optional(),
  status: z.enum(["ativo", "concluido", "cancelado"]).optional(),
  referenceDate: z.string().datetime().or(z.string().min(1)).optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const existing = await prisma.project.findFirst({
    where: { id, tenantId: s.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data: Prisma.ProjectUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.clientName !== undefined)
    data.clientName = parsed.data.clientName;
  if (parsed.data.value !== undefined)
    data.value = new Prisma.Decimal(parsed.data.value);
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.referenceDate !== undefined)
    data.referenceDate = new Date(parsed.data.referenceDate);
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ ...project, value: Number(project.value) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const existing = await prisma.project.findFirst({
    where: { id, tenantId: s.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
