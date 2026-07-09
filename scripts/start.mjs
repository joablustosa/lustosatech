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

try {
  // Etapa crítica: aplica as migrations no banco (o app não funciona sem o schema).
  run("npx prisma migrate deploy");

  // Opcional: cria admin/dados iniciais. Não bloqueia a subida do site se falhar
  // (ex.: versão de Node sem --experimental-strip-types). Use Node 22 LTS no runtime.
  run("node --experimental-strip-types prisma/seed.ts", { fatal: false });

  // Sobe o Next.js na porta que o Azure define via variável PORT.
  run(`npx next start -p ${port}`);
} catch {
  process.exit(1);
}
