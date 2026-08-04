/**
 * Hook oficial do Next.js: roda uma vez quando o servidor sobe (dev e start).
 * Inicia o worker do pipeline de vídeo no mesmo processo do backend —
 * sem precisar hospedar um serviço separado.
 */
export async function register() {
  // O padrão com o if positivo é obrigatório: permite ao bundler remover o
  // import do bundle edge (onde módulos do Node como fs/path não existem).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Não inicia durante o build (prerender).
    if (process.env.NEXT_PHASE === "phase-production-build") return;
    const { startVideoPipelineWorker } = await import(
      "./lib/video-pipeline/worker"
    );
    startVideoPipelineWorker();
  }
}
