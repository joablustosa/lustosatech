import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";
import { processDueVideoPosts } from "@/lib/video-pipeline/worker";

// Status em que o pipeline já está trabalhando no post.
const IN_PROGRESS_STATUSES = [
  "generating_script",
  "script_ready",
  "generating_assets",
  "assembling",
  "sending",
];

/**
 * "Enviar agora": antecipa o agendamento para já e dispara o worker em
 * background, sem esperar o tick de 60s. Útil para testar o fluxo completo.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const post = await prisma.videoPost.findFirst({
    where: { id, tenantId: s.tenantId },
  });
  if (!post) {
    return NextResponse.json(
      { error: "Postagem não encontrada" },
      { status: 404 }
    );
  }
  if (IN_PROGRESS_STATUSES.includes(post.status)) {
    return NextResponse.json(
      { error: "Esta postagem já está sendo processada" },
      { status: 409 }
    );
  }

  const updated = await prisma.videoPost.update({
    where: { id: post.id },
    data: {
      scheduledAt: new Date(),
      autoSend: true,
      status: "scheduled",
      error: null,
    },
  });

  // Dispara o worker sem bloquear a resposta; o claim atômico evita
  // processamento duplicado caso o tick de 60s rode ao mesmo tempo.
  void processDueVideoPosts().catch((err) =>
    console.error("[video-worker] erro no envio imediato:", err)
  );

  return NextResponse.json(updated);
}
