import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { count } = await prisma.document.updateMany({
    where: { id, tenantId: s.tenantId },
    data: parsed.data,
  });
  if (count === 0) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }
  const doc = await prisma.document.findUnique({ where: { id } });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const { count } = await prisma.document.deleteMany({
    where: { id, tenantId: s.tenantId },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
