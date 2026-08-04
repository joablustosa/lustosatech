import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { generateReport } from "@/lib/ai/report";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, tenantId: s.tenantId },
    select: { id: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }
  try {
    const report = await generateReport(id);
    return NextResponse.json(report);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao gerar relatório.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
