import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@empresa.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Administrador";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });
  console.log(`✔ Admin pronto: ${email} (senha: ${password})`);

  // Documento de exemplo
  const exampleDocCount = await prisma.document.count();
  if (exampleDocCount === 0) {
    await prisma.document.create({
      data: {
        title: "Sobre a Empresa (exemplo)",
        filename: "sobre.md",
        content: `# Sobre a nossa empresa

Somos a **Lustosa Tech**, especializada em soluções de automação e
inteligência artificial para pequenas e médias empresas.

## O que fazemos
- Automação de atendimento no WhatsApp
- Desenvolvimento de sistemas sob medida
- Consultoria em IA

## Horário de atendimento
Segunda a sexta, das 9h às 18h.

## Planos
- **Starter**: R$ 297/mês — automação básica de atendimento.
- **Pro**: R$ 597/mês — automação + agendamento + relatórios.
- **Enterprise**: sob consulta.

## Contato
Para falar com um especialista, agende uma reunião pelo nosso link.`,
        enabled: true,
      },
    });
    console.log("✔ Documento de exemplo criado");
  }

  // Configurações padrão
  const defaults: Record<string, string> = {
    companyName: "Lustosa Tech",
    aiPersona:
      "Você é um assistente de vendas simpático, objetivo e prestativo. " +
      "Responda sempre em português do Brasil, de forma calorosa e profissional. " +
      "Use apenas as informações dos documentos da empresa. Quando o cliente " +
      "demonstrar interesse em contratar, conhecer melhor ou tirar dúvidas " +
      "aprofundadas, ofereça agendar uma reunião.",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("✔ Configurações padrão prontas");

  // Slots de exemplo (próximos dias úteis, 10h e 14h)
  const slotCount = await prisma.availabilitySlot.count();
  if (slotCount === 0) {
    const now = new Date();
    const slots: { startsAt: Date; endsAt: Date }[] = [];
    let added = 0;
    let day = 1;
    while (added < 6) {
      const d = new Date(now);
      d.setDate(now.getDate() + day);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        for (const hour of [10, 14]) {
          const start = new Date(d);
          start.setHours(hour, 0, 0, 0);
          const end = new Date(start);
          end.setMinutes(30);
          slots.push({ startsAt: start, endsAt: end });
          added++;
        }
      }
      day++;
    }
    await prisma.availabilitySlot.createMany({ data: slots });
    console.log(`✔ ${slots.length} horários de exemplo criados`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
