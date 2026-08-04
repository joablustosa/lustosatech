import pkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = "tenant_default";

async function main() {
  // Tenant padrão (recebe todos os dados públicos do site)
  const tenant = await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {},
    create: {
      id: DEFAULT_TENANT_ID,
      name: "Lustosa Tech",
      slug: "lustosa-tech",
    },
  });
  console.log(`✔ Tenant padrão pronto: ${tenant.name}`);

  const email = process.env.ADMIN_EMAIL || "joab@lustosa.tech";
  const password = process.env.ADMIN_PASSWORD || "0bgmtfs0";
  const name = process.env.ADMIN_NAME || "Joab";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: { passwordHash, name, role: "admin", active: true },
    create: {
      tenantId: tenant.id,
      email,
      passwordHash,
      name,
      role: "admin",
      active: true,
    },
  });
  console.log(`✔ Admin pronto: ${email} (senha: ${password})`);

  // Documento de exemplo
  const exampleDocCount = await prisma.document.count({
    where: { tenantId: tenant.id },
  });
  if (exampleDocCount === 0) {
    await prisma.document.create({
      data: {
        tenantId: tenant.id,
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
    bookingBaseUrl:
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://lustosawhatsapp-cfaedzbtg9fubadx.canadacentral-01.azurewebsites.net",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key } },
      update: {},
      create: { tenantId: tenant.id, key, value },
    });
  }
  console.log("✔ Configurações padrão prontas");

  // Slots de exemplo (próximos dias úteis, 10h e 14h)
  const slotCount = await prisma.availabilitySlot.count({
    where: { tenantId: tenant.id },
  });
  if (slotCount === 0) {
    const now = new Date();
    const slots: { tenantId: string; startsAt: Date; endsAt: Date }[] = [];
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
          slots.push({ tenantId: tenant.id, startsAt: start, endsAt: end });
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
