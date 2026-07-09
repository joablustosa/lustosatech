import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { generateReport } from "@/lib/ai/report";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  try {
    const report = await generateReport(id);
    return NextResponse.json(report);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao gerar relatório.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
