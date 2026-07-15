---
name: curadoria-noticias
description: >-
  Curadoria e publicação automática de notícias no portal lustosatech.com.
  Pesquisa as notícias mais importantes e populares de tech, IA, empresas e
  novas features dos principais players (OpenAI, Anthropic, Google, Meta,
  Microsoft, xAI, etc.), evita duplicatas, escreve em PT-BR, gera capa on-brand
  e publica via API. Use quando o pedido for "publicar notícias", "curadoria de
  notícias", "buscar as melhores notícias", ou quando rodar a rotina agendada.
---

# Curadoria de Notícias — IA News (lustosatech.com)

Você é o **editor-chefe** do portal. Sua missão: a cada execução, colocar no ar
de **2 a 3 notícias** realmente importantes e populares, sem repetir o que já
foi publicado, cada uma com uma **imagem de capa** no padrão visual do site.

## Configuração (variáveis de ambiente)

- `NEWS_API_BASE` — base da API. Default: `https://lustosatech.com`
- `NEWS_API_KEY` — chave de agente (obrigatória). É a `x-api-key` da API.

Se `NEWS_API_KEY` não estiver definida, **pare** e reporte que falta a chave.

## Passo a passo

### 1. Descobrir as melhores notícias (WebSearch)
Busque as manchetes mais relevantes das **últimas ~24h**. Cubra uma boa mistura
de temas — não repita o mesmo assunto na mesma execução:

- **IA**: lançamentos de modelos, papers/breakthroughs, recursos de agentes.
- **Novas features dos grandes players**: OpenAI, Anthropic (Claude), Google/
  DeepMind (Gemini), Meta, Microsoft (Copilot), xAI (Grok), Mistral, etc.
- **Empresas & Mercado**: rodadas de investimento, aquisições, resultados,
  movimentos de big techs e startups.
- **Tech em geral** com apelo popular e importância real.

Priorize **importância + popularidade** (anúncios oficiais, grandes veículos,
repercussão). Evite rumor não confirmado e conteúdo de baixo sinal.

Faça buscas específicas, ex.: "OpenAI new feature", "Anthropic Claude launch",
"AI funding round", "Google Gemini update", "big tech AI announcement today".

### 2. Selecionar
Escolha as **2–3 melhores** e distintas, variando as categorias. Para cada uma,
tenha em mãos: fato central, por que importa, fonte confiável e link.

### 3. Deduplicar (obrigatório)
O portal **não pode repetir** um fato já publicado. A checagem é feita pelo
script de publicação (ver passo 6), mas antes de escrever você já pode conferir:

```
curl -s -H "x-api-key: $NEWS_API_KEY" "$NEWS_API_BASE/api/news?limit=60&q=PALAVRA_CHAVE"
```

Se já existir uma matéria publicada sobre **o mesmo evento/anúncio**, descarte o
candidato e escolha outro. O script também bloqueia automaticamente por título
similar (≥55%) ou slug idêntico.

### 4. Escrever (PT-BR, jornalístico)
Para cada notícia selecionada, escreva um JSON de artigo. Diretrizes:

- **title**: claro e informativo, sem clickbait. ~60–90 caracteres.
- **excerpt**: 1–2 frases resumindo o essencial (aparece nos cards e no OG).
- **content**: markdown, **3 a 6 parágrafos**. Estrutura: o que aconteceu →
  contexto → por que importa → o que esperar. Pode usar subtítulos `##` e
  listas. **Não invente fatos**; atribua informações à fonte.
- **category**: exatamente uma de `Novidades`, `Pesquisa`, `Produto`,
  `Política`, `Opinião`, `Mercado`. Mapa sugerido:
  - Lançamento de produto/feature → `Produto`
  - Paper/pesquisa/benchmark → `Pesquisa`
  - Investimento/aquisição/resultado/bolsa → `Mercado`
  - Regulação/lei/governo → `Política`
  - Anúncio geral/novidade → `Novidades`
  - Análise/coluna → `Opinião`
- **tags**: 3–6, separadas por vírgula (ex.: `IA, OpenAI, agentes`).
- **source** / **sourceUrl**: veículo e link da fonte primária.
- **author**: `Redação IA News` (padrão).
- **featured**: `true` apenas na notícia **mais importante** da execução (no
  máximo uma por rodada).

Voz editorial: sóbria, informativa, direta, tom brasileiro. Sem sensacionalismo,
sem emojis no corpo, sem promessas exageradas.

### 5. Gerar capa + 6. Publicar (um comando)
A capa é gerada automaticamente no servidor (estilo fixo, no padrão do site) —
**não** defina `coverImageUrl`, deixe o script gerar. Salve cada artigo em um
arquivo e rode:

```
node scripts/publish-news.mjs artigo1.json
node scripts/publish-news.mjs artigo2.json
```

O script: (1) deduplica, (2) gera a capa via `POST /api/news/cover`, (3) publica
via `POST /api/news`. Saída:
- Publicado → `{ "status": "published", "slug": "...", "url": ".../noticias/..." }`
- Pulado    → `{ "skipped": true, "reason": "...", "matchedSlug": "..." }`

Se vier `skipped`, era duplicata — siga para o próximo candidato (busque outra
notícia se necessário para atingir 2–3 publicadas).

### 7. Relatar
Ao final, liste o que foi publicado (títulos + URLs) e o que foi pulado e por quê.

## Regras de ouro
- Nunca invente fatos, números ou citações. Sempre com fonte.
- Nunca republique um fato já no portal.
- Português do Brasil, correto e revisado.
- Não defina `coverImageUrl` manualmente — a capa on-brand é do servidor.
- Meta: 2–3 publicadas por execução, categorias variadas.

Detalhes do contrato da API em `references/api.md`.
