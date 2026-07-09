import { execSync } from "node:child_process";

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

  // Sobe o Next.js na porta que o Azure define via variavel PORT.
  run(`${next} start -p ${port}`);
} catch {
  process.exit(1);
}
