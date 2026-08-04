import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  role: z.enum(["admin", "member"]).optional(),
});

export async function GET() {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const users = await prisma.adminUser.findMany({
    where: { tenantId: s.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  if (s instanceof NextResponse) return s;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;

  const exists = await prisma.adminUser.findUnique({
    where: { tenantId_email: { tenantId: s.tenantId, email } },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Já existe um usuário com esse email" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: {
      tenantId: s.tenantId,
      name,
      email,
      passwordHash,
      role: role ?? "member",
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json(user, { status: 201 });
}
