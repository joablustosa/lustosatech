#!/usr/bin/env node
/**
 * Publica UMA notícia no portal, cuidando da parte mecânica:
 *   1. Deduplica contra as notícias já publicadas (evita repetir o mesmo fato).
 *   2. Gera a imagem de capa on-brand (POST /api/news/cover) se não vier pronta.
 *   3. Publica (POST /api/news).
 *
 * A CURADORIA e a REDAÇÃO são responsabilidade de quem chama (o agente): este
 * script só recebe o artigo já escrito em JSON e o publica com segurança.
 *
 * Uso:
 *   node scripts/publish-news.mjs artigo.json
 *   echo '<json>' | node scripts/publish-news.mjs        # via stdin
 *   node scripts/publish-news.mjs artigo.json --force     # ignora dedupe
 *   node scripts/publish-news.mjs artigo.json --dry-run   # não publica, só checa
 *
 * Env obrigatórias:
 *   NEWS_API_BASE  (ex.: https://lustosatech.com)   default: https://lustosatech.com
 *   NEWS_API_KEY   (a mesma x-api-key do POST /api/news)
 *
 * JSON do artigo (campos):
 *   title*        string
 *   excerpt*      string  (resumo curto)
 *   content*      string  (markdown)
 *   category      Novidades|Pesquisa|Produto|Política|Opinião|Mercado
 *   tags          string  (separadas por vírgula)
 *   source        string  (nome do veículo)
 *   sourceUrl     string  (url da fonte)
 *   author        string
 *   featured      boolean
 *   coverImageUrl string  (se já tiver; senão é gerada)
 *
 * Saída: JSON no stdout com { status, slug, url } ou { skipped, reason }.
 */

// ATENÇÃO: o apex lustosatech.com NÃO está vinculado ao App Service (retorna
// 404 da Azure). O host correto do site é www.lustosatech.com.
const BASE = (process.env.NEWS_API_BASE || "https://www.lustosatech.com").replace(/\/+$/, "");
const KEY = process.env.NEWS_API_KEY;

const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
const fileArg = args.find((a) => !a.startsWith("--"));

function die(msg, extra) {
  console.error(JSON.stringify({ error: msg, ...(extra || {}) }, null, 2));
  process.exit(1);
}

async function readInput() {
  if (fileArg) {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(fileArg, "utf8"));
  }
  // stdin
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) die("Nenhum JSON recebido (arquivo ou stdin).");
  return JSON.parse(raw);
}

// --- normalização e similaridade para dedupe -----------------------------

const STOP = new Set(
  ("a o os as de da do das dos e ou que com sem para por no na nos nas um uma " +
    "the of to in on and or for with new is are be as at").split(" ")
);

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));
}

function jaccard(aSet, bSet) {
  if (!aSet.size || !bSet.size) return 0;
  let inter = 0;
  for (const t of aSet) if (bSet.has(t)) inter++;
  return inter / (aSet.size + bSet.size - inter);
}

function slugify(text) {
  return norm(text).replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

// --- HTTP helpers ---------------------------------------------------------

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": KEY,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`${init.method || "GET"} ${path} → ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function isDuplicate(article) {
  // 1) busca por palavras-chave do título
  const kw = [...tokens(article.title)].slice(0, 4).join(" ");
  const found = new Map(); // slug -> item
  for (const q of [kw, article.title]) {
    if (!q) continue;
    try {
      const list = await api(`/api/news?limit=50&q=${encodeURIComponent(q)}`);
      for (const it of Array.isArray(list) ? list : []) found.set(it.slug, it);
    } catch {
      /* busca best-effort */
    }
  }
  // também compara com as mais recentes (evita depender só da busca)
  try {
    const recent = await api(`/api/news?limit=60`);
    for (const it of Array.isArray(recent) ? recent : []) found.set(it.slug, it);
  } catch {
    /* ignore */
  }

  const wantSlug = slugify(article.title);
  const titleTokens = tokens(article.title);

  for (const it of found.values()) {
    if (it.slug === wantSlug) return { dup: true, match: it, reason: "slug idêntico" };
    const sim = jaccard(titleTokens, tokens(it.title));
    if (sim >= 0.55) {
      return { dup: true, match: it, reason: `título ${(sim * 100) | 0}% similar` };
    }
  }
  return { dup: false };
}

// --- main -----------------------------------------------------------------

async function main() {
  if (!KEY) die("Defina NEWS_API_KEY no ambiente.");
  const a = await readInput();
  for (const f of ["title", "excerpt", "content"]) {
    if (!a[f] || !String(a[f]).trim()) die(`Campo obrigatório ausente: ${f}`);
  }

  if (!force) {
    const d = await isDuplicate(a);
    if (d.dup) {
      console.log(
        JSON.stringify(
          { skipped: true, reason: d.reason, matchedSlug: d.match?.slug, title: a.title },
          null,
          2
        )
      );
      return;
    }
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, wouldPublish: a.title }, null, 2));
    return;
  }

  // capa: gera localmente (OpenAI) e sobe no Azure Blob. Assim o fluxo não
  // depende de o servidor de produção ter chave da OpenAI / conexão de Blob.
  // Se faltar env local, cai para o endpoint /api/news/cover do servidor.
  let coverImageUrl = a.coverImageUrl;
  if (!coverImageUrl) {
    const hasLocalCover =
      process.env.OPENAI_API_KEY && process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (hasLocalCover) {
      const { generateAndUploadCover } = await import("./news-cover.mjs");
      const cover = await generateAndUploadCover({
        title: a.title,
        category: a.category,
        summary: a.excerpt,
      });
      coverImageUrl = cover.url;
    } else {
      const cover = await api(`/api/news/cover`, {
        method: "POST",
        body: JSON.stringify({
          title: a.title,
          category: a.category,
          summary: a.excerpt,
        }),
      });
      coverImageUrl = cover.url;
    }
  }

  // publica
  const news = await api(`/api/news`, {
    method: "POST",
    body: JSON.stringify({
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      category: a.category || "Novidades",
      tags: a.tags,
      source: a.source,
      sourceUrl: a.sourceUrl,
      author: a.author || "Redação IA News",
      featured: !!a.featured,
      coverImageUrl,
      status: "published",
    }),
  });

  console.log(
    JSON.stringify(
      { status: "published", slug: news.slug, url: `${BASE}/noticias/${news.slug}`, coverImageUrl },
      null,
      2
    )
  );
}

main().catch((e) => die(e.message, { body: e.body, status: e.status }));
