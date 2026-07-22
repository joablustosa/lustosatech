// Blocos de validação compartilhados entre o cadastro (POST /api/news) e a
// edição (PATCH /api/news/[id]).
//
// PROBLEMA QUE ISTO RESOLVE: `z.string().optional()` aceita `undefined`, mas
// NÃO aceita `null`. Como o banco devolve `null` nos campos opcionais, o
// formulário de edição reenviava esses `null` e o zod quebrava com
// "Expected string, received null". Aqui os campos opcionais aceitam
// string, "", null ou ausência, e normalizam para um valor previsível.
import { z } from "zod";

/**
 * Texto opcional. Semântica da saída:
 *   - ausente (undefined) → `undefined` → no PATCH significa "não alterar"
 *   - "" ou null          → `null`      → limpa o campo no banco
 *   - texto               → texto com as pontas aparadas
 */
export const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  });

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** URL opcional — mesma semântica de optionalText, validando http(s). */
export const optionalUrl = optionalText.refine(
  (v) => v == null || isHttpUrl(v),
  { message: "URL inválida — use http:// ou https://" }
);

/** Data opcional em string ISO. "" e null limpam; valor inválido é rejeitado. */
export const optionalDate = optionalText.refine(
  (v) => v == null || !Number.isNaN(new Date(v).getTime()),
  { message: "Data inválida" }
);

/**
 * Campo de enum não-nulável (a coluna tem default no banco): `null` é tratado
 * como "não informado" para nunca tentar gravar null numa coluna NOT NULL.
 */
export function optionalEnum<const T extends readonly [string, ...string[]]>(
  values: T
) {
  return z
    .union([z.enum(values), z.null()])
    .optional()
    .transform((v) => v ?? undefined);
}

/** Booleano opcional; null vira "não informado". */
export const optionalBool = z
  .union([z.boolean(), z.null()])
  .optional()
  .transform((v) => v ?? undefined);

/** Texto obrigatório (aparado), com mensagem amigável. */
export function requiredText(message: string) {
  return z.string({ required_error: message, invalid_type_error: message })
    .trim()
    .min(1, message);
}

export const MEDIA_TYPES = ["image", "video"] as const;
export const NEWS_STATUS = ["draft", "published"] as const;
