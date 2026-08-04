import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";
import {
  runClaimedVideoPost,
  RESUMABLE_STATUSES,
} from "@/lib/video-pipeline/worker";

/**
 * "Enviar agora": reivindica a postagem e dispara o pipeline.
 *
 * Usa `after()` do Next.js para continuar o trabalho depois da resposta HTTP
 * (no Azure, um `void promise` solto costuma ser morto e o status fica preso
 * em "gerando..." sem nunca gravar o erro).
 *
 * O modal NÃO precisa ficar aberto — o processamento é no servidor.
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

  // Se já está processando "agora" (updatedAt recente), não reinicia.
  const recentlyTouched =
    Date.now() - new Date(post.updatedAt).getTime() < 90_000;
  if (RESUMABLE_STATUSES.includes(post.status) && recentlyTouched) {
    return NextResponse.json(
      {
        error:
          "Esta postagem já está sendo processada. Acompanhe o status neste modal (atualiza sozinho).",
        post,
      },
      { status: 409 }
    );
  }

  // Claim imediato: a UI já recebe "generating_script" na resposta.
  const { count } = await prisma.videoPost.updateMany({
    where: { id: post.id, status: post.status },
    data: {
      scheduledAt: new Date(),
      autoSend: true,
      status: "generating_script",
      error: null,
    },
  });
  if (count === 0) {
    return NextResponse.json(
      { error: "Não foi possível iniciar o processamento (conflito de status)." },
      { status: 409 }
    );
  }

  const updated = await prisma.videoPost.findUnique({ where: { id: post.id } });

  // Continua depois da resposta — o modal NÃO precisa ficar aberto.
  after(async () => {
    await runClaimedVideoPost(id);
  });

  return NextResponse.json(updated);
}
