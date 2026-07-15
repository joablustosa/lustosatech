# Contrato da API de Notícias

Base: `NEWS_API_BASE` (produção: `https://lustosatech.com`).
Auth de agente: header `x-api-key: $NEWS_API_KEY` (ou `Authorization: Bearer ...`).

## GET /api/news — listar / buscar (dedupe)
Query params:
- `q` — busca em título/resumo (contains)
- `category` — filtra por categoria
- `slug` — busca por slug exato
- `limit` — máx. 100 (default 50)

Retorna array de notícias publicadas. Use para checar duplicatas.

```bash
curl -s -H "x-api-key: $NEWS_API_KEY" \
  "$NEWS_API_BASE/api/news?limit=60&q=openai"
```

## POST /api/news/cover — gerar capa on-brand
Gera a imagem no servidor (OpenAI, estilo fixo = padrão do site) e faz upload no
Azure Blob. Devolve a URL pública. **Preferir usar o script**, que já chama isto.

Body:
```json
{ "title": "Título da notícia", "category": "Produto", "summary": "resumo curto" }
```
Resposta `201`:
```json
{ "url": "https://<blob>/news-media/....png", "mediaType": "image" }
```

## POST /api/news — publicar
Body (obrigatórios: `title`, `excerpt`, `content`):
```json
{
  "title": "…",
  "excerpt": "…",
  "content": "# markdown…",
  "category": "Novidades | Pesquisa | Produto | Política | Opinião | Mercado",
  "tags": "IA, OpenAI, agentes",
  "source": "TechCrunch",
  "sourceUrl": "https://…",
  "author": "Redação IA News",
  "featured": false,
  "coverImageUrl": "https://…(vinda do /cover)…",
  "status": "published"
}
```
Resposta `201`: objeto da notícia criada (contém `slug`). A página fica em
`$NEWS_API_BASE/noticias/<slug>`.

## Categorias válidas
`Novidades`, `Pesquisa`, `Produto`, `Política`, `Opinião`, `Mercado`.

## Erros comuns
- `401 Não autorizado` → `NEWS_API_KEY` errada/ausente.
- `400` → campo obrigatório faltando ou categoria/URL inválida.
- `500` na capa → chave da OpenAI não configurada no servidor, ou Blob ausente.

## Recomendado: usar o script
`node scripts/publish-news.mjs artigo.json` cuida de dedupe + capa + publish.
Flags: `--force` (ignora dedupe), `--dry-run` (não publica).
