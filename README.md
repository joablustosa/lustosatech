# ZapVenda — Automação de Atendimento e Vendas por WhatsApp

Atendimento automático no WhatsApp com IA: responde dúvidas sobre a sua empresa
(com base em documentos `.md`), entende **texto, áudio e imagens**, **agenda
reuniões** e gera um **relatório da conversa** para você fechar a venda.

## Stack

- **Next.js 15** (App Router) + TypeScript — front e back no mesmo app
- **Tailwind CSS** — interface bonita, responsiva, com modo escuro
- **Prisma + SQLite** — banco local, zero configuração
- **Auth.js (NextAuth v5)** — login do backoffice
- **OpenAI** — GPT-4o (conversa + visão) e Whisper (áudio)
- **WhatsApp Cloud API** (Meta) — API oficial

## Telas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | público | Landing page |
| `/agendar` | público | Cliente escolhe um horário e agenda a reunião |
| `/admin/login` | público | Login do backoffice |
| `/admin` | protegido | Dashboard |
| `/admin/conversations` | protegido | Conversas + **testador da IA** + relatórios |
| `/admin/documents` | protegido | Importar/gerenciar documentos `.md` |
| `/admin/availability` | protegido | Definir horários disponíveis |
| `/admin/settings` | protegido | Credenciais WhatsApp/OpenAI e persona da IA |

## Como rodar (desenvolvimento)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
#   edite o .env se quiser (o AUTH_SECRET já vem preenchido no .env gerado)

# 3. Criar o banco e popular dados de exemplo
npx prisma db push
npx prisma db seed

# 4. Subir o servidor
npm run dev
```

Acesse http://localhost:3000

**Login inicial** (definido no `.env` / seed):
- Email: `admin@empresa.com`
- Senha: `admin123`

## Configuração da IA

1. Entre no painel → **Configurações**.
2. Cole sua **chave da OpenAI** (`sk-...`).
3. Ajuste o **nome da empresa** e a **personalidade da IA**.
4. Vá em **Documentos** e importe seus arquivos `.md` sobre a empresa.

Pronto: já dá para testar em **Conversas → Testar assistente**, enviando
texto, imagem ou áudio, sem precisar da Meta configurada.

## Configuração do WhatsApp (API oficial)

1. Crie um app no [Meta for Developers](https://developers.facebook.com/) com o
   produto **WhatsApp**.
2. Pegue o **Phone Number ID** e um **Access Token**.
3. No painel → **Configurações**, preencha:
   - Phone Number ID
   - Access Token
   - Verify Token (invente um, ex.: `meu-verify-token`)
4. Exponha o servidor publicamente (em dev use [ngrok](https://ngrok.com/)):
   ```bash
   ngrok http 3000
   ```
5. No painel da Meta, cadastre o **Webhook**:
   - URL de callback: `https://SEU-DOMINIO/api/whatsapp/webhook`
   - Verify token: o mesmo que você colocou nas Configurações
   - Assine o campo **messages**.
6. Envie uma mensagem para o número do WhatsApp Business e veja a IA responder.

> As credenciais podem ficar no `.env` **ou** na tela de Configurações
> (a tela tem prioridade). Em produção, considere criptografar os segredos.

## Como funciona o fluxo

```
Cliente (WhatsApp) → Webhook → entende mídia (Whisper/GPT-4o Vision)
   → monta contexto (persona + documentos + histórico)
   → GPT-4o gera resposta (e pode oferecer agendamento)
   → envia resposta pelo WhatsApp
   → salva tudo para o relatório de vendas
```

## Scripts

| Comando | Ação |
|---------|------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npx prisma db seed` | Popular banco (admin, documento e horários de exemplo) |
| `npx prisma studio` | Explorar o banco visualmente |

## Evoluções possíveis (fora do escopo atual)

- Busca vetorial (embeddings) para bases de conhecimento grandes
- Criptografia dos segredos em repouso
- Sincronização com Google Calendar
- Múltiplas empresas (multi-tenant)
