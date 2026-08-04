import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  accountName: z.string().min(1).optional(),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(1)).optional(),
  platformInstagram: z.boolean().optional(),
  platformYoutube: z.boolean().optional(),
  platformTiktok: z.boolean().optional(),
  platformKwai: z.boolean().optional(),
  autoSend: z.boolean().optional(),
  voiceId: z.string().max(191).optional().nullable(),
  status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const post = await prisma.videoPost.findFirst({
    where: { id, tenantId: s.tenantId },
    include: {
      script: {
        include: { prompts: { orderBy: { sequence: "asc" } } },
      },
    },
  });
  if (!post) {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }
  return NextResponse.json(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
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

  const { scheduledAt: scheduledAtRaw, ...rest } = parsed.data;
  const data: {
    title?: string;
    prompt?: string;
    accountName?: string;
    scheduledAt?: Date;
    platformInstagram?: boolean;
    platformYoutube?: boolean;
    platformTiktok?: boolean;
    platformKwai?: boolean;
    autoSend?: boolean;
    voiceId?: string | null;
    status?: string;
  } = { ...rest };

  if (scheduledAtRaw) {
    const date = new Date(scheduledAtRaw);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    data.scheduledAt = date;
  }

  const existing = await prisma.videoPost.findFirst({
    where: { id, tenantId: s.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }

  const merged = {
    platformInstagram:
      parsed.data.platformInstagram ?? existing.platformInstagram,
    platformYoutube: parsed.data.platformYoutube ?? existing.platformYoutube,
    platformTiktok: parsed.data.platformTiktok ?? existing.platformTiktok,
    platformKwai: parsed.data.platformKwai ?? existing.platformKwai,
  };
  if (
    !merged.platformInstagram &&
    !merged.platformYoutube &&
    !merged.platformTiktok &&
    !merged.platformKwai
  ) {
    return NextResponse.json(
      { error: "Selecione ao menos uma plataforma" },
      { status: 400 }
    );
  }

  const post = await prisma.videoPost.update({
    where: { id },
    data,
  });
  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { id } = await params;
  const { count } = await prisma.videoPost.deleteMany({
    where: { id, tenantId: s.tenantId },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
