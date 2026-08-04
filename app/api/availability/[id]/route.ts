import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const slot = await prisma.availabilitySlot.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { meeting: true },
  });
  if (!slot) {
    return NextResponse.json({ error: "Horário não encontrado" }, { status: 404 });
  }
  if (slot.meeting) {
    return NextResponse.json(
      { error: "Este horário já está reservado e não pode ser removido." },
      { status: 400 }
    );
  }
  await prisma.availabilitySlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
