import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
}

export interface SceneAsset {
  sequence: number;
  videoUrl: string;
  audioUrl: string | null;
}

export interface TargetDimensions {
  width: number;
  height: number;
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar asset (${res.status}): ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

function run(cmd: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

/**
 * Monta o vídeo final: para cada cena, mixa o clipe com a narração e ajusta
 * para a dimensão alvo (scale + pad, preservando proporção — é aqui que o 4K
 * é feito por upscale, já que o Veo não gera 4K nativo); depois concatena
 * todas as cenas na ordem da sequência. Retorna o mp4 final.
 */
export async function assembleVideo(
  scenes: SceneAsset[],
  target: TargetDimensions
): Promise<Buffer> {
  if (scenes.length === 0) throw new Error("Nenhuma cena para montar.");

  const dir = await mkdtemp(path.join(tmpdir(), "video-pipeline-"));
  try {
    const ordered = [...scenes].sort((a, b) => a.sequence - b.sequence);
    const segmentPaths: string[] = [];

    const scaleFilter =
      `scale=${target.width}:${target.height}:force_original_aspect_ratio=decrease,` +
      `pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2`;

    for (const scene of ordered) {
      const clipPath = path.join(dir, `clip_${scene.sequence}.mp4`);
      await download(scene.videoUrl, clipPath);

      const segPath = path.join(dir, `seg_${scene.sequence}.mp4`);

      if (scene.audioUrl) {
        const audioPath = path.join(dir, `audio_${scene.sequence}.mp3`);
        await download(scene.audioUrl, audioPath);
        // Narração substitui o áudio do clipe; corta no fim da mídia mais curta.
        await run(
          ffmpeg()
            .input(clipPath)
            .input(audioPath)
            .outputOptions([
              "-map 0:v:0",
              "-map 1:a:0",
              `-vf ${scaleFilter}`,
              "-c:v libx264",
              "-preset veryfast",
              "-crf 23",
              "-c:a aac",
              "-b:a 128k",
              "-shortest",
              "-pix_fmt yuv420p",
              "-r 30",
            ])
            .output(segPath)
        );
      } else {
        // Sem narração: apenas normaliza o clipe para o concat.
        await run(
          ffmpeg()
            .input(clipPath)
            .outputOptions([
              `-vf ${scaleFilter}`,
              "-c:v libx264",
              "-preset veryfast",
              "-crf 23",
              "-c:a aac",
              "-b:a 128k",
              "-pix_fmt yuv420p",
              "-r 30",
            ])
            .output(segPath)
        );
      }
      segmentPaths.push(segPath);
    }

    // Concatena os segmentos (demuxer concat, sem re-encode).
    const listPath = path.join(dir, "list.txt");
    await writeFile(
      listPath,
      segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
    );
    const finalPath = path.join(dir, "final.mp4");
    await run(
      ffmpeg()
        .input(listPath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy"])
        .output(finalPath)
    );

    return await readFile(finalPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
