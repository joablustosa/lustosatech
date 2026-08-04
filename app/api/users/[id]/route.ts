import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "member"]).optional(),
  active: z.boolean().optional(),
});

/** Impede remover/despromover o último admin ativo do tenant. */
async function wouldRemoveLastAdmin(
  tenantId: string,
  userId: string,
  change: { role?: string; active?: boolean; delete?: boolean }
): Promise<boolean> {
  const target = await prisma.adminUser.findFirst({
    where: { id: userId, tenantId },
  });
  if (!target) return false;
  const losesAdmin =
    change.delete ||
    change.active === false ||
    (change.role && change.role !== "admin");
  if (!losesAdmin || target.role !== "admin" || !target.active) return false;

  const otherAdmins = await prisma.adminUser.count({
    where: { tenantId, role: "admin", active: true, NOT: { id: userId } },
  });
  return otherAdmins === 0;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireAdmin();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const target = await prisma.adminUser.findFirst({
    where: { id, tenantId: s.tenantId },
  });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (
    await wouldRemoveLastAdmin(s.tenantId, id, {
      role: parsed.data.role,
      active: parsed.data.active,
    })
  ) {
    return NextResponse.json(
      { error: "O tenant precisa de ao menos um administrador ativo" },
      { status: 400 }
    );
  }

  const { password, ...rest } = parsed.data;
  const data: {
    name?: string;
    role?: string;
    active?: boolean;
    passwordHash?: string;
  } = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireAdmin();
  if (s instanceof NextResponse) return s;

  const { id } = await params;

  const target = await prisma.adminUser.findFirst({
    where: { id, tenantId: s.tenantId },
  });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  if (id === s.userId) {
    return NextResponse.json(
      { error: "Você não pode excluir a si mesmo" },
      { status: 400 }
    );
  }
  if (await wouldRemoveLastAdmin(s.tenantId, id, { delete: true })) {
    return NextResponse.json(
      { error: "O tenant precisa de ao menos um administrador ativo" },
      { status: 400 }
    );
  }

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
