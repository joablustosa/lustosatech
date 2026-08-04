# Instruções para agentes de IA

Todo o contexto do projeto (arquitetura, multi-tenancy, pipeline de vídeo,
mapa de rotas, variáveis de ambiente e convenções obrigatórias) está no
[README.md](README.md). **Leia o README antes de alterar código**, em
especial as seções "Regra crítica: onde fica cada chave/credencial" e
"Convenções para agentes de IA".

Resumo das regras inegociáveis:

- APIs do admin sempre com `requireSession()`/`requireAdmin()` (`lib/api.ts`)
  e filtro por `tenantId`; conteúdo público usa `DEFAULT_TENANT_ID`
  (`lib/tenant.ts`).
- Chaves de IA (OpenAI/Gemini/ElevenLabs) somente via `.env` — nunca como
  Setting por tenant.
- Migrations: SQL manual em `prisma/migrations/` (sem `prisma migrate dev`);
  depois `npx --no-install prisma generate`.
- Ambiente dev é Windows/PowerShell: sem `&&` e sem heredoc.
- Antes de finalizar: `npx --no-install tsc --noEmit` e `npm run build`.
- UI em PT-BR; commits em PT sem acentos (`feat: adiciona ...`); nunca
  commitar `.env`.
