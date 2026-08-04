import { prisma } from "../db";
import { uploadToBlob } from "../blob";
import { generateScript, splitIntoScenes } from "./script";
import { generateVideoClip } from "./veo";
import { generateNarration } from "./elevenlabs";
import { assembleVideo } from "./assemble";
import { deliverVideo } from "./deliver";

const INTERVAL_MS = 60_000; // 1 em 1 minuto

// Status intermediários retomados caso o processo tenha caído no meio.
const RESUMABLE_STATUSES = [
  "generating_script",
  "script_ready",
  "generating_assets",
  "assembling",
  "sending",
];

let running = false;

/** Um tick do worker: reivindica e processa postagens vencidas. */
export async function processDueVideoPosts(): Promise<void> {
  const now = new Date();

  // Candidatos: agendados com envio automático já vencidos, ou postagens
  // presas em status intermediário há mais de 15 min (retomada).
  const staleBefore = new Date(now.getTime() - 15 * 60_000);
  const candidates = await prisma.videoPost.findMany({
    where: {
      autoSend: true,
      OR: [
        { status: "scheduled", scheduledAt: { lte: now } },
        { status: { in: RESUMABLE_STATUSES }, updatedAt: { lte: staleBefore } },
      ],
    },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });

  for (const candidate of candidates) {
    // Claim atômico: só processa se ninguém mudou o status desde a leitura
    // (seguro com múltiplas instâncias do app).
    const { count } = await prisma.videoPost.updateMany({
      where: { id: candidate.id, status: candidate.status },
      data: { status: "generating_script", error: null },
    });
    if (count === 0) continue;

    try {
      await processPost(candidate.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[video-worker] post ${candidate.id} falhou:`, message);
      await prisma.videoPost
        .update({
          where: { id: candidate.id },
          data: { status: "failed", error: message },
        })
        .catch(() => {});
    }
  }
}

/** Executa o pipeline completo para uma postagem (retomável por etapa). */
async function processPost(postId: string): Promise<void> {
  const post = await prisma.videoPost.findUnique({
    where: { id: postId },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      script: { include: { prompts: { orderBy: { sequence: "asc" } } } },
    },
  });
  if (!post) return;
  const tenantId = post.tenantId;

  // 1) Roteiro (GPT) — pula se já existe
  let script = post.script;
  if (!script) {
    console.log(`[video-worker] gerando roteiro: ${post.title}`);
    const content = await generateScript({
      title: post.title,
      prompt: post.prompt,
      accountName: post.accountName,
    });
    script = await prisma.videoScript.create({
      data: { tenantId, videoPostId: post.id, content, status: "ready" },
      include: { prompts: { orderBy: { sequence: "asc" } } },
    });
  }

  // 2) Divisão em prompts de vídeo (cenas) — pula se já existem
  if (script.prompts.length === 0) {
    await prisma.videoPost.update({
      where: { id: post.id },
      data: { status: "script_ready" },
    });
    console.log(`[video-worker] dividindo roteiro em cenas: ${post.title}`);
    const scenes = await splitIntoScenes(script.content);
    await prisma.videoPrompt.createMany({
      data: scenes.map((s) => ({
        tenantId,
        scriptId: script!.id,
        sequence: s.sequence,
        prompt: s.prompt,
        narration: s.narration || null,
      })),
    });
    script = (await prisma.videoScript.findUnique({
      where: { id: script.id },
      include: { prompts: { orderBy: { sequence: "asc" } } },
    }))!;
  }

  // 3) Assets por cena: clipe (Veo) + narração (ElevenLabs) — retomável
  await prisma.videoPost.update({
    where: { id: post.id },
    data: { status: "generating_assets" },
  });
  for (const prompt of script.prompts) {
    let videoUrl = prompt.videoUrl;
    let audioUrl = prompt.audioUrl;

    if (!videoUrl) {
      console.log(
        `[video-worker] gerando clipe ${prompt.sequence}/${script.prompts.length}: ${post.title}`
      );
      const clip = await generateVideoClip(prompt.prompt);
      videoUrl = await uploadToBlob(clip, "video/mp4", `scene-${prompt.sequence}.mp4`);
      await prisma.videoPrompt.update({
        where: { id: prompt.id },
        data: { videoUrl, status: "video_done" },
      });
    }

    if (!audioUrl && prompt.narration) {
      console.log(
        `[video-worker] gerando narração ${prompt.sequence}/${script.prompts.length}: ${post.title}`
      );
      const audio = await generateNarration(prompt.narration, post.voiceId);
      audioUrl = await uploadToBlob(audio, "audio/mpeg", `scene-${prompt.sequence}.mp3`);
    }

    await prisma.videoPrompt.update({
      where: { id: prompt.id },
      data: { videoUrl, audioUrl, status: "done", error: null },
    });
  }

  // 4) Montagem (ffmpeg) — pula se o vídeo final já existe
  let finalVideoUrl = post.finalVideoUrl;
  if (!finalVideoUrl) {
    await prisma.videoPost.update({
      where: { id: post.id },
      data: { status: "assembling" },
    });
    console.log(`[video-worker] montando vídeo final: ${post.title}`);
    const prompts = await prisma.videoPrompt.findMany({
      where: { scriptId: script.id },
      orderBy: { sequence: "asc" },
    });
    const finalVideo = await assembleVideo(
      prompts.map((p) => ({
        sequence: p.sequence,
        videoUrl: p.videoUrl!,
        audioUrl: p.audioUrl,
      }))
    );
    finalVideoUrl = await uploadToBlob(finalVideo, "video/mp4", "final.mp4");
    await prisma.videoPost.update({
      where: { id: post.id },
      data: { finalVideoUrl },
    });
  }

  // 5) Entrega no webhook (opcional — sem URL, o vídeo fica só no Blob)
  await prisma.videoPost.update({
    where: { id: post.id },
    data: { status: "sending" },
  });
  console.log(`[video-worker] enviando para o webhook: ${post.title}`);
  const delivered = await deliverVideo(post, post.tenant, finalVideoUrl);

  await prisma.videoPost.update({
    where: { id: post.id },
    data: { status: "sent", error: null },
  });
  console.log(
    `[video-worker] concluído${delivered ? "" : " (sem webhook; vídeo no Blob)"}: ${post.title}`
  );
}

/** Inicia o loop do worker (1 tick por minuto), sem sobreposição de ticks. */
export function startVideoPipelineWorker(): void {
  const g = globalThis as { __videoWorkerStarted?: boolean };
  if (g.__videoWorkerStarted) return;
  g.__videoWorkerStarted = true;

  console.log("[video-worker] iniciado (intervalo de 60s)");
  setInterval(async () => {
    if (running) return; // tick anterior ainda em andamento
    running = true;
    try {
      await processDueVideoPosts();
    } catch (err) {
      console.error("[video-worker] erro no tick:", err);
    } finally {
      running = false;
    }
  }, INTERVAL_MS);
}
