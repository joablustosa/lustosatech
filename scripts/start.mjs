import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

function run(cmd, { fatal = true } = {}) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", env: process.env });
  } catch (err) {
    if (fatal) throw err;
    console.error(`(ignorado) etapa opcional falhou: ${cmd}`);
  }
}

const port = process.env.PORT || "3000";

// Chamamos os binarios via "node <caminho>" em vez de "npx" porque, no deploy
// do Azure App Service Linux, os atalhos em node_modules/.bin podem perder a
// permissao de execucao (erro "prisma: Permission denied").
const prisma = "node node_modules/prisma/build/index.js";
const next = "node node_modules/next/dist/bin/next";

try {
  // No Azure o node_modules e re-extraido de um .tar.gz a cada boot, SEM o
  // Prisma Client gerado (.prisma/client). Por isso geramos o client sempre,
  // antes de qualquer coisa que o utilize (seed, migrate, next).
  run(`${prisma} generate`);

  // Etapa critica: aplica as migrations (o app nao funciona sem o schema).
  run(`${prisma} migrate deploy`);

  // Cria admin/dados iniciais (agora com o client disponivel). Nao bloqueia o boot.
  run("node --experimental-strip-types prisma/seed.ts", { fatal: false });

  // SEMPRE reconstroi o .next no boot. No Azure o .next antigo persiste em
  // /home entre deploys, entao o app acabava servindo o build DESATUALIZADO
  // (mudancas de codigo nao apareciam). Reconstruir garante que o site reflita
  // o codigo recem-deployado. Se ja houver um build e o rebuild falhar,
  // mantemos o antigo (nao derruba o site).
  // Requer WEBSITES_CONTAINER_START_TIME_LIMIT alto (ex.: 1800) para dar tempo.
  const hadBuild = existsSync(".next/BUILD_ID");
  console.log(
    hadBuild
      ? "Reconstruindo .next (garante codigo atualizado)..."
      : ".next ausente — rodando next build..."
  );
  run(`${next} build`, { fatal: !hadBuild });

  // Sobe o Next.js na porta que o Azure define via variavel PORT.
  run(`${next} start -p ${port}`);
} catch {
  process.exit(1);
}
