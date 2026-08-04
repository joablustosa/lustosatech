import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { uniqueTenantSlug } from "@/lib/tenant";

const registerSchema = z.object({
  company: z.string().min(2, "Informe o nome da empresa"),
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { company, name, email, password } = parsed.data;
  const slug = await uniqueTenantSlug(company);
  const passwordHash = await bcrypt.hash(password, 10);

  // Primeiro usuário do cadastro é sempre o admin do tenant.
  const tenant = await prisma.tenant.create({
    data: {
      name: company,
      slug,
      users: {
        create: {
          email,
          name,
          passwordHash,
          role: "admin",
          active: true,
        },
      },
    },
  });

  return NextResponse.json(
    { ok: true, tenantId: tenant.id },
    { status: 201 }
  );
}
