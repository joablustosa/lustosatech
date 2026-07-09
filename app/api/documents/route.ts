import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  filename: z.string().optional(),
  content: z.string().min(1, "Conteúdo obrigatório"),
  enabled: z.boolean().optional(),
});

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const doc = await prisma.document.create({ data: parsed.data });
  return NextResponse.json(doc, { status: 201 });
}
