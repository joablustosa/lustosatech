import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { isValidSlotStart, slotEnd } from "@/lib/availability";

const bookSchema = z.object({
  startsAt: z.string().min(1, "Horário inválido"),
  clientName: z.string().min(1, "Informe seu nome"),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bookSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { startsAt, clientName, clientEmail, clientPhone, notes } = parsed.data;

  const start = new Date(startsAt);
  if (!isValidSlotStart(start)) {
    return NextResponse.json(
      { error: "Horário indisponível. Escolha outro horário." },
      { status: 400 }
    );
  }
  const end = slotEnd(start);

  try {
    const meeting = await prisma.$transaction(async (tx) => {
      // Reserva o horário criando o slot. A unique (tenantId, startsAt)
      // impede que dois clientes peguem o mesmo horário.
      const slot = await tx.availabilitySlot.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          startsAt: start,
          endsAt: end,
          isBooked: true,
        },
      });

      // Tenta vincular a uma conversa existente pelo telefone.
      let conversationId: string | null = null;
      if (clientPhone) {
        const digits = clientPhone.replace(/\D/g, "");
        if (digits) {
          const convo = await tx.conversation.findFirst({
            where: {
              tenantId: DEFAULT_TENANT_ID,
              waPhone: { contains: digits.slice(-8) },
            },
          });
          if (convo) {
            conversationId = convo.id;
            await tx.conversation.update({
              where: { id: convo.id },
              data: { status: "agendado" },
            });
          }
        }
      }

      return tx.meeting.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          slotId: slot.id,
          clientName,
          clientEmail: clientEmail || null,
          clientPhone: clientPhone || null,
          notes: notes || null,
          conversationId,
        },
        include: { slot: true },
      });
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (err) {
    // Violação de unique => horário já foi reservado por outra pessoa.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Este horário acabou de ser reservado. Escolha outro." },
        { status: 409 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Não foi possível agendar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Lista os agendamentos (reuniões) para o painel administrativo. */
export async function GET() {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const meetings = await prisma.meeting.findMany({
    where: { tenantId: s.tenantId },
    include: { slot: true },
    orderBy: { slot: { startsAt: "asc" } },
  });
  return NextResponse.json(meetings);
}
