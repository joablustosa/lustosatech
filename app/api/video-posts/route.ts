import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

const createSchema = z
  .object({
    title: z.string().min(1, "Título obrigatório"),
    prompt: z.string().min(1, "Prompt do roteiro obrigatório"),
    accountName: z.string().min(1, "Nome da conta obrigatório"),
    scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
    platformInstagram: z.boolean().optional(),
    platformYoutube: z.boolean().optional(),
    platformTiktok: z.boolean().optional(),
    platformKwai: z.boolean().optional(),
    autoSend: z.boolean().optional(),
    status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
  })
  .refine(
    (d) =>
      d.platformInstagram ||
      d.platformYoutube ||
      d.platformTiktok ||
      d.platformKwai,
    { message: "Selecione ao menos uma plataforma" }
  );

export async function GET(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where =
    from && to
      ? {
          scheduledAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }
      : undefined;

  const posts = await prisma.videoPost.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(posts);
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

  const { scheduledAt, ...rest } = parsed.data;
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const post = await prisma.videoPost.create({
    data: {
      ...rest,
      scheduledAt: date,
      status: rest.status ?? "scheduled",
    },
  });
  return NextResponse.json(post, { status: 201 });
}
