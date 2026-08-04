# LustosaTech — Plataforma SaaS multi-tenant (site, notícias, WhatsApp IA e vídeos automáticos)

Aplicação Next.js única (front + back + worker) que roda em produção em
**https://lustosatech.com** (Azure App Service). Reúne:

1. **Site institucional** público (landing, produtos, cases).
2. **Portal de notícias de tecnologia/IA** com automação de curadoria.
3. **Backoffice multi-tenant** (`/admin`) — cada empresa (tenant) tem seus
   próprios usuários, dados e configurações.
4. **Agente de atendimento no WhatsApp** com IA (GPT-4o): responde texto,
   áudio e imagem, usa base de conhecimento em markdown, agenda reuniões e
   gera relatório de vendas da conversa.
5. **Calendário de postagens de vídeo** com **pipeline 100% automático**:
   roteiro (GPT) → cenas → clipes (Gemini/Veo) → narração (ElevenLabs) →
   montagem (ffmpeg) → Azure Blob → webhook de entrega.

> Este README é a fonte de contexto do projeto para humanos e agentes de IA
> (Cursor/Claude). Leia a seção **"Convenções para agentes de IA"** antes de
> alterar código.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15.1 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS 3 (modo escuro, tokens em CSS vars) |
| Banco | MySQL 8 (Azure Database for MySQL; Docker Compose em dev) via Prisma 6 |
| Auth | Auth.js / next-auth v5 (JWT com `tenantId` e `role` na sessão) |
| Validação | Zod |
| IAs | OpenAI (GPT-4o + Whisper), Gemini (Veo 3) e ElevenLabs |
| Mídia | Azure Blob Storage (`@azure/storage-blob`) + ffmpeg (`fluent-ffmpeg` + `ffmpeg-static`) |
| Ícones | lucide-react |
| Deploy | Azure App Service via GitHub Actions (`.github/workflows/main_lustosawhatsapp.yml`) |

---

## Multi-tenancy (como funciona)

- Todo dado do admin pertence a um **`Tenant`** (`prisma/schema.prisma`).
- **Registro público** em `/admin/register` (`POST /api/register`): cria o
  tenant e o primeiro usuário, que vira **admin** do tenant. Demais usuários
  são geridos em `/admin/users` (roles: `admin` | `member`).
- A sessão JWT carrega `tenantId` e `role` (`lib/auth.ts`). Nas APIs, use os
  helpers de `lib/api.ts`:
  - `requireSession()` → retorna `{ userId, tenantId, role }` ou `NextResponse` 401.
  - `requireAdmin()` → igual, mas exige role `admin` (403 caso contrário).
- **Conteúdo público** (site, portal de notícias, agendamento) é servido do
  tenant padrão: `DEFAULT_TENANT_ID` em `lib/tenant.ts` (slug `lustosatech`,
  criado pelo seed).
- Configurações por tenant ficam na tabela `Setting` (chave/valor composto
  `tenantId + key`) — ver `lib/settings.ts`.

## Regra crítica: onde fica cada chave/credencial

| Tipo | Onde | Motivo |
|---|---|---|
| Chaves de IA: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY` | **Somente `.env`** (nunca Setting por tenant) | São da empresa; o uso das IAs é cobrado de forma centralizada |
| Credenciais de redes sociais (Instagram/YouTube/TikTok/Kwai: usuário e senha) | **Setting por tenant** (tela Configurações) | São dados do cliente; vão no payload do webhook de entrega |
| WhatsApp (token, phone id, verify token), `newsApiKey`, `videoWebhookUrl` | Setting por tenant **com fallback no `.env`** (banco tem prioridade) | Configuráveis pela tela sem reiniciar o app |
| Azure Blob (`AZURE_STORAGE_CONNECTION_STRING`) | `.env` (ou Setting `azureStorageConnection`) | Infra da empresa |

Segredos na tela de Configurações são mascarados (`SECRET_KEYS` em
`lib/settings.ts`); enviar vazio = manter o valor atual.

---

## Modelos de dados (Prisma)

| Model | O que é |
|---|---|
| `Tenant` | Empresa/conta; raiz de todos os dados do admin |
| `AdminUser` | Usuário do backoffice (`role`: admin/member, único por `tenantId+email`) |
| `Document` | Base de conhecimento `.md` usada pelo agente do WhatsApp |
| `Conversation` / `Message` | Conversas do WhatsApp (única por `tenantId+waPhone`) e mensagens (texto/imagem/áudio) |
| `AvailabilitySlot` / `Meeting` | Horários disponíveis e reuniões agendadas |
| `Setting` | Chave/valor por tenant (PK composta `tenantId+key`) |
| `News` | Notícias do portal (slug único por tenant, capa/vídeo no Blob) |
| `VideoPost` | Evento do calendário de vídeo: título, prompt, conta, plataformas, `autoSend`, `voiceId` (ElevenLabs por vídeo), `format` (vertical/horizontal), `resolution` (fullhd/4k), `style` (cinematic/anime/cartoon2d/presentation), `status`, `finalVideoUrl`, `error` |
| `VideoScript` | Roteiro completo gerado por IA (LONGTEXT), 1:1 com `VideoPost` |
| `VideoPrompt` | Cenas do roteiro: `sequence`, `prompt` visual (inglês, p/ Veo), `narration` (PT-BR, p/ ElevenLabs), URLs dos assets no Blob, status por cena |

Status do `VideoPost` (pipeline): `draft | scheduled | generating_script |
script_ready | generating_assets | assembling | sending | sent | failed`.

Migrations em `prisma/migrations/` (SQL escrito à mão, aplicado com
`prisma migrate deploy` no startup do deploy — ver `scripts/start.mjs`).

---

## Pipeline automático de vídeo

O coração do produto. Worker em background dentro do próprio Next.js:

```
instrumentation.ts (runtime nodejs) → startVideoPipelineWorker()
  → tick a cada 60s → processDueVideoPosts()
```

Fluxo por postagem (tudo em `lib/video-pipeline/`):

1. **Candidatos** (`worker.ts`): posts com `autoSend=true` e `scheduledAt`
   vencido, ou presos em status intermediário há 15+ min (retomada). Claim
   atômico via `updateMany` condicional (seguro com múltiplas instâncias).
2. **Roteiro** (`script.ts` → `generateScript`): GPT-4o escreve o roteiro em
   PT-BR considerando formato (short = gancho em 3s, máx 60s; horizontal =
   desenvolvimento longo) e estilo. Salvo em `VideoScript`.
3. **Cenas** (`script.ts` → `splitIntoScenes`): GPT divide em até 20 cenas de
   ~8s, cada uma com prompt visual em inglês + narração em PT-BR
   (`VideoPrompt`).
4. **Assets por cena** (retomável — pula o que já tem URL):
   - Clipe: `veo.ts` → Gemini/Veo 3 com `aspectRatio` da config e prefixo de
     estilo no prompt; polling até concluir; upload no Blob.
   - Narração: `elevenlabs.ts` → TTS com a voz do post (`voiceId`) ou a
     padrão do env; upload no Blob.
5. **Montagem** (`assemble.ts`): ffmpeg mixa clipe+narração por cena
   (narração substitui o áudio), aplica scale/pad para a dimensão alvo
   (1080x1920, 1920x1080, 2160x3840 ou 3840x2160 — 4K é upscale, o Veo não
   gera 4K nativo) e concatena. Upload do final no Blob (`finalVideoUrl`).
6. **Entrega** (`deliver.ts`): `POST` JSON no webhook (Setting
   `videoWebhookUrl` do tenant, fallback env `VIDEO_WEBHOOK_URL`). Payload:
   `{ event: "video.ready", videoUrl, post: {..., platforms}, tenant,
   credentials }` — `credentials` traz usuário/senha (Settings do tenant)
   apenas das plataformas marcadas no post. **Webhook é opcional**: sem URL,
   o vídeo fica no Blob e o post conclui como `sent` mesmo assim.

Formato/qualidade/estilo (`format.ts`): catálogos e `buildStylePrefix()` —
o usuário escolhe nos cards do modal e o prefixo é adicionado
automaticamente aos prompts (ele não precisa repetir em cada evento).

Extras do calendário (`components/video-post-calendar.tsx`, página
`/admin/video-posts`):

- Visual estilo Google Calendar (grade mensal, eventos coloridos por
  plataforma, modal create/edit).
- **Ideia de prompt**: botão que chama `POST /api/video-posts/prompt-idea`
  (agente GPT cria prompt a partir do título ou melhora o rascunho); o
  usuário confirma ("Usar este prompt") antes de aplicar.
- **Enviar agora**: `POST /api/video-posts/[id]/send-now` antecipa
  `scheduledAt`, liga `autoSend` e dispara o worker na hora (teste do fluxo).
- Painel de pipeline no modal: status, roteiro gerado, cenas com status
  individual e link do vídeo final.
- Seletor de voz por vídeo carregado de `GET /api/voices` (lista da conta
  ElevenLabs; vira input livre se a key não estiver no env).

## Agente de WhatsApp com IA

- Webhook oficial da Meta: `GET/POST /api/whatsapp/webhook`
  (verify token + recebimento de mensagens).
- `lib/ai/ingest.ts` → `processIncomingMessage(tenantId, ...)`: transcreve
  áudio (Whisper), descreve imagem (GPT-4o Vision), salva na conversa.
- `lib/ai/agent.ts` → `generateReply`: monta contexto (persona do tenant +
  documentos habilitados + histórico) e responde; tem tool de agendamento
  (lista slots livres e marca reunião).
- `lib/ai/report.ts`: relatório da conversa em JSON (lead, interesse,
  próximos passos) exibido em `/admin/conversations/[id]`.
- Testador sem Meta: `POST /api/whatsapp/simulate` (usado pela tela de
  conversas).

## Portal de notícias

- Público: home `/` (destaques), `/noticias/[slug]`, sitemap.
- Admin: `/admin/news` (CRUD, upload de capa/vídeo para o Blob).
- **Automação de curadoria** (skill `.claude/skills/curadoria-noticias/`):
  agente publica via `POST /api/news` autenticando com header `x-api-key`
  (Setting `newsApiKey` do tenant padrão, fallback `NEWS_API_KEY`).
  Scripts auxiliares: `scripts/publish-news.mjs` e `scripts/news-cover.mjs`
  (capa on-brand gerada com gpt-image-1 → Blob).

---

## Mapa de rotas

### Páginas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | público | Landing + notícias em destaque |
| `/noticias/[slug]` | público | Notícia completa |
| `/produtos`, `/produtos/[slug]`, `/cases` | público | Institucional |
| `/agendar` | público | Agendamento de reunião (tenant padrão) |
| `/admin/login`, `/admin/register` | público | Login e registro de tenant |
| `/admin` | protegido | Dashboard (contadores + avisos de configuração) |
| `/admin/conversations`, `/admin/conversations/[id]` | protegido | Conversas + testador da IA + relatório |
| `/admin/documents` | protegido | Base de conhecimento `.md` |
| `/admin/availability` | protegido | Horários disponíveis |
| `/admin/news`, `/admin/news/new`, `/admin/news/[id]/edit` | protegido | CRUD de notícias |
| `/admin/video-posts` | protegido | Calendário de postagens de vídeo |
| `/admin/users` | protegido (admin) | Usuários do tenant |
| `/admin/settings` | protegido | Configurações do tenant |

### APIs principais

| Rota | Auth | Descrição |
|---|---|---|
| `POST /api/register` | pública | Cria tenant + primeiro admin |
| `GET/POST /api/users`, `PATCH/DELETE /api/users/[id]` | admin | Gestão de usuários (protege o último admin) |
| `GET/PUT /api/settings` | sessão | Settings do tenant (`ALLOWED_KEYS` em `app/api/settings/route.ts`) |
| `GET/POST /api/documents`, `[id]` | sessão | Base de conhecimento |
| `GET/POST /api/availability`, `[id]`, `GET /api/availability/public` | sessão / pública | Slots |
| `POST /api/meetings` | pública | Agendamento pelo site |
| `GET/POST /api/news`, `[id]`, `upload`, `cover` | sessão ou `x-api-key` | Notícias (POST aceita agente com `x-api-key`) |
| `GET/POST /api/video-posts`, `GET/PATCH/DELETE /api/video-posts/[id]` | sessão | CRUD do calendário (GET [id] inclui script + cenas) |
| `POST /api/video-posts/prompt-idea` | sessão | Agente de ideia/melhoria de prompt |
| `POST /api/video-posts/[id]/send-now` | sessão | Dispara o pipeline imediatamente |
| `GET /api/voices` | sessão | Vozes da conta ElevenLabs (cache 5 min) |
| `GET/POST /api/whatsapp/webhook`, `POST /api/whatsapp/simulate` | Meta / sessão | WhatsApp |
| `GET /api/public/info` | pública | Infos públicas do tenant padrão |

---

## Estrutura de pastas (o que importa)

```
app/
  (páginas públicas: page.tsx, noticias/, produtos/, cases/, agendar/)
  admin/
    login/, register/            # públicas
    (panel)/                     # layout protegido (sidebar + SessionProvider)
      page.tsx (dashboard), conversations/, documents/, availability/,
      news/, video-posts/, users/, settings/
  api/                           # todas as rotas de API (ver mapa acima)
components/
  video-post-calendar.tsx        # calendário completo (grade, modal, pipeline panel)
  sidebar.tsx, session-provider.tsx, ...
lib/
  api.ts          # requireSession / requireAdmin (tenant scoping)
  auth.ts         # next-auth v5 (JWT com tenantId/role) + type augmentation
  tenant.ts       # DEFAULT_TENANT_ID + helpers de slug
  settings.ts     # get/setSetting por tenant, SETTING_ENV_FALLBACK, SECRET_KEYS
  openai.ts       # getOpenAI() (env-only) + visão/whisper/geração de imagem
  blob.ts         # uploadToBlob (Azure, container público de leitura)
  news.ts         # slug único por tenant, validação x-api-key
  ai/             # agente WhatsApp: ingest.ts, agent.ts, report.ts
  video-pipeline/
    worker.ts     # loop 60s, claim atômico, orquestração retomável
    script.ts     # GPT: roteiro + divisão em cenas
    veo.ts        # Gemini/Veo: clipe por cena (aspectRatio via config)
    elevenlabs.ts # TTS por cena (voz por post)
    assemble.ts   # ffmpeg: mix + scale/pad + concat
    deliver.ts    # webhook opcional + credenciais sociais do tenant
    format.ts     # catálogos formato/resolução/estilo + prefixo de prompt
prisma/
  schema.prisma, seed.ts, migrations/   # migrations SQL manuais
scripts/
  start.mjs        # produção: migrate deploy + seed + next start
  publish-news.mjs, news-cover.mjs      # automação de notícias
instrumentation.ts # inicia o worker (só runtime nodejs)
next.config.mjs    # serverExternalPackages: fluent-ffmpeg, ffmpeg-static, @google/genai
```

---

## Variáveis de ambiente (`.env.example`)

| Variável | Uso |
|---|---|
| `DATABASE_URL` | MySQL (dev: docker-compose `mysql://root:root@localhost:3306/zapvenda`) |
| `AUTH_SECRET` | Auth.js |
| `ADMIN_EMAIL/PASSWORD/NAME` | Admin inicial criado pelo seed (tenant padrão) |
| `OPENAI_API_KEY` | **Central da empresa** — agente, roteiros, ideia de prompt, relatórios |
| `GEMINI_API_KEY` | **Central** — clipes Veo |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL` | **Central** — narração (voz padrão: Rachel; modelo padrão: `eleven_multilingual_v2`) |
| `VIDEO_WEBHOOK_URL` | Fallback do webhook de entrega (opcional) |
| `AZURE_STORAGE_CONNECTION_STRING` / `AZURE_STORAGE_CONTAINER` | Blob (container padrão `news-media`) |
| `WHATSAPP_ACCESS_TOKEN/PHONE_NUMBER_ID/VERIFY_TOKEN` | Fallback do WhatsApp |
| `NEXT_PUBLIC_BASE_URL` | URL pública (links de agendamento) |
| `NEWS_API_KEY` / `NEWS_API_BASE` | Automação de notícias |
| `VIDEO_SCRIPT_MODEL` / `VIDEO_VEO_MODEL` | Overrides de modelo (padrões: `gpt-4o`, `veo-3.1-generate-001` com fallback `veo-3.1-fast-generate-001`) |

## Como rodar (dev)

```bash
docker compose up -d      # MySQL local
npm install
cp .env.example .env      # preencha as chaves
npm run db:migrate && npm run db:seed
npm run dev               # http://localhost:3000
```

Login inicial (seed): `joab@lustosa.tech` / `0bgmtfs0` (tenant `lustosatech`).

| Script | Ação |
|---|---|
| `npm run dev` / `npm run build` | Dev / build (build roda `prisma generate` antes) |
| `npm start` | Produção: migrations + seed + `next start` (`scripts/start.mjs`) |
| `npm run db:migrate` / `db:seed` | `prisma migrate deploy` / seed |

## Deploy

Push na `main` → GitHub Actions → Azure App Service (**lustosawhatsapp**).
As migrations aplicam automaticamente no startup. Configure as envs no App
Service (mesmas do `.env.example`).

---

## Convenções para agentes de IA (Cursor/Claude)

1. **Tenant scoping é obrigatório**: toda rota de API do admin começa com
   `const s = await requireSession(); if (s instanceof NextResponse) return s;`
   e filtra por `s.tenantId`. Conteúdo público usa `DEFAULT_TENANT_ID`.
2. **Chaves de IA nunca viram Setting por tenant** — sempre `process.env`
   (ver "Regra crítica" acima). Não readicione campos de chave de IA na tela
   de Configurações.
3. **Migrations**: escreva o SQL à mão em
   `prisma/migrations/<timestamp>_<nome>/migration.sql` (não use
   `prisma migrate dev`; o Docker local geralmente está parado). Elas rodam
   no deploy. Depois de mudar o schema, rode `npx --no-install prisma generate`.
4. **Prisma 6**: use sempre `npx --no-install` para não puxar o Prisma 7 do
   npx (quebra a validação do schema).
5. **Ambiente dev é Windows/PowerShell**: sem `&&` (use `;` ou comandos
   separados) e sem heredoc (para commits longos, escreva a mensagem em
   arquivo e use `git commit -F`).
6. **Worker**: código novo do pipeline deve ser idempotente/retomável (pula
   etapas que já têm resultado salvo) e usar claim atômico se criar novos
   pontos de entrada. Pacotes Node nativos entram em `serverExternalPackages`
   no `next.config.mjs`.
7. **Validação antes de finalizar**: `npx --no-install tsc --noEmit` e
   `npm run build`.
8. **UI**: PT-BR, Tailwind com tokens do projeto (`card`, `input`, `label`,
   `btn-primary`, `btn-outline`, `btn-ghost`, `muted`), ícones lucide-react,
   segredos mascarados nas telas.
9. **Git**: mensagens de commit em PT sem acentos no imperativo
   (`feat: adiciona ...`), push para `https://github.com/joablustosa/lustosatech`
   (credencial já escopada no remote). Nunca commitar `.env`.

## Estado atual (o que já está funcionando)

- [x] Site institucional + portal de notícias com automação de curadoria
- [x] Multi-tenancy completo (registro, usuários, escopo em todas as APIs)
- [x] Agente WhatsApp (texto/áudio/imagem, agendamento, relatório)
- [x] Calendário de vídeo estilo Google Calendar
- [x] Pipeline automático de vídeo de ponta a ponta (worker de 60s)
- [x] Voz ElevenLabs por vídeo + formato/qualidade/estilo por evento
- [x] Agente de ideia/melhoria de prompt + botão "Enviar agora"
- [x] Webhook de entrega opcional com credenciais sociais por tenant
- [ ] Publicação direta nas redes (hoje é via webhook para API externa)
- [ ] Busca vetorial (embeddings) para bases de conhecimento grandes
- [ ] Criptografia de segredos em repouso
