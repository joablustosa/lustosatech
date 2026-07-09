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
  // Etapa critica: aplica as migrations (o app nao funciona sem o schema).
  run(`${prisma} migrate deploy`);

  // Opcional: cria admin/dados iniciais. Nao bloqueia a subida do site se falhar.
  run("node --experimental-strip-types prisma/seed.ts", { fatal: false });

  // No Azure, o Oryx as vezes reempacota o app e o build do Next (.next) nao
  // chega no servidor. Se estiver ausente, geramos aqui (self-healing).
  // Requer WEBSITES_CONTAINER_START_TIME_LIMIT alto (ex.: 1800) para dar tempo.
  if (!existsSync(".next/BUILD_ID")) {
    console.log(".next ausente — rodando prisma generate + next build...");
    run(`${prisma} generate`);
    run(`${next} build`);
  }

  // Sobe o Next.js na porta que o Azure define via variavel PORT.
  run(`${next} start -p ${port}`);
} catch {
  process.exit(1);
}
