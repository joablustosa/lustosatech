import { execSync } from "node:child_process";

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

const port = process.env.PORT || "3000";

try {
  run("npx prisma migrate deploy");
  run("node --experimental-strip-types prisma/seed.ts");
  run(`npx next start -p ${port}`);
} catch {
  process.exit(1);
}
