/**
 * Catálogo de formato, resolução e estilo de animação dos vídeos.
 *
 * O usuário escolhe essas opções no evento do calendário e o pipeline monta
 * automaticamente o prefixo do prompt — assim ele não precisa repetir
 * "vídeo vertical em 4k estilo anime..." em cada agendamento.
 */

export type VideoFormat = "vertical" | "horizontal";
export type VideoResolution = "fullhd" | "4k";
export type VideoStyle = "cinematic" | "anime" | "cartoon2d" | "presentation";

export interface FormatOptions {
  format: VideoFormat;
  resolution: VideoResolution;
  style: VideoStyle;
}

/** Instruções em inglês (para o Veo e os prompts visuais das cenas). */
const FORMAT_PROMPT: Record<VideoFormat, string> = {
  vertical:
    "Vertical 9:16 short-form video optimized for mobile (Reels, TikTok, Shorts), subject centered in the vertical frame",
  horizontal:
    "Horizontal 16:9 widescreen video optimized for YouTube and TV viewing",
};

const RESOLUTION_PROMPT: Record<VideoResolution, string> = {
  fullhd: "Full HD 1080p quality, sharp and clean image",
  "4k": "Ultra high definition 4K quality, extremely detailed and sharp image",
};

const STYLE_PROMPT: Record<VideoStyle, string> = {
  cinematic:
    "cinematic live-action sequence, professional cinematography, realistic lighting, shallow depth of field, film grain",
  anime:
    "anime style animation, vibrant colors, expressive characters, dynamic camera angles, Japanese animation aesthetics",
  cartoon2d:
    "2D cartoon animation, flat colors, bold outlines, playful and friendly character design",
  presentation:
    "clean motion-graphics presentation style, animated infographics, minimal flat design, smooth transitions between visual elements",
};

/** Instruções em PT-BR para o roteirista (GPT) adequar ritmo e estrutura. */
const FORMAT_SCRIPT_HINT: Record<VideoFormat, string> = {
  vertical:
    "O vídeo é um SHORT vertical (Reels/TikTok/Shorts): curto e direto, " +
    "gancho fortíssimo nos 3 primeiros segundos, ritmo acelerado, no máximo " +
    "60 segundos no total.",
  horizontal:
    "O vídeo é horizontal (YouTube): pode ter desenvolvimento mais longo e " +
    "aprofundado, com introdução, desenvolvimento e conclusão bem definidos.",
};

const STYLE_SCRIPT_HINT: Record<VideoStyle, string> = {
  cinematic:
    "O estilo visual é cinematográfico realista (filmagem live-action).",
  anime: "O estilo visual é animação anime.",
  cartoon2d: "O estilo visual é desenho animado 2D (cartoon).",
  presentation:
    "O estilo visual é apresentação animada (motion graphics/infográficos), " +
    "ideal para conteúdo educativo ou institucional.",
};

const DEFAULTS: FormatOptions = {
  format: "vertical",
  resolution: "fullhd",
  style: "cinematic",
};

/** Normaliza valores vindos do banco (strings) para as opções conhecidas. */
export function normalizeFormatOptions(post: {
  format?: string | null;
  resolution?: string | null;
  style?: string | null;
}): FormatOptions {
  const format = (
    post.format && post.format in FORMAT_PROMPT ? post.format : DEFAULTS.format
  ) as VideoFormat;
  const resolution = (
    post.resolution && post.resolution in RESOLUTION_PROMPT
      ? post.resolution
      : DEFAULTS.resolution
  ) as VideoResolution;
  const style = (
    post.style && post.style in STYLE_PROMPT ? post.style : DEFAULTS.style
  ) as VideoStyle;
  return { format, resolution, style };
}

/**
 * Prefixo em inglês adicionado ao início de cada prompt visual de cena
 * (Veo). O usuário descreve só o conteúdo; formato/qualidade/estilo entram
 * automaticamente daqui.
 */
export function buildStylePrefix(opts: FormatOptions): string {
  return `${FORMAT_PROMPT[opts.format]}. ${RESOLUTION_PROMPT[opts.resolution]}. Style: ${STYLE_PROMPT[opts.style]}.`;
}

/** Orientações em PT-BR incluídas no prompt do roteirista (GPT). */
export function buildScriptHint(opts: FormatOptions): string {
  return `${FORMAT_SCRIPT_HINT[opts.format]} ${STYLE_SCRIPT_HINT[opts.style]}`;
}

/** Aspect ratio aceito pela API do Veo. */
export function veoAspectRatio(format: VideoFormat): "9:16" | "16:9" {
  return format === "vertical" ? "9:16" : "16:9";
}

/**
 * Dimensão alvo do vídeo final (ffmpeg). O Veo não gera 4K nativamente, então
 * para 4k o upscale acontece na montagem.
 */
export function targetDimensions(opts: FormatOptions): {
  width: number;
  height: number;
} {
  if (opts.format === "vertical") {
    return opts.resolution === "4k"
      ? { width: 2160, height: 3840 }
      : { width: 1080, height: 1920 };
  }
  return opts.resolution === "4k"
    ? { width: 3840, height: 2160 }
    : { width: 1920, height: 1080 };
}
