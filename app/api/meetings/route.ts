import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

const bookSchema = z.object({
  slotId: z.string().min(1),
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
  const { slotId, clientName, clientEmail, clientPhone, notes } = parsed.data;

  try {
    const meeting = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
      });
      if (!slot) throw new Error("Horário não encontrado.");
      if (slot.isBooked) throw new Error("Este horário já foi reservado.");

      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      // Tenta vincular a uma conversa existente pelo telefone
      let conversationId: string | null = null;
      if (clientPhone) {
        const digits = clientPhone.replace(/\D/g, "");
        if (digits) {
          const convo = await tx.conversation.findFirst({
            where: {
              tenantId: slot.tenantId,
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
          tenantId: slot.tenantId ?? DEFAULT_TENANT_ID,
          slotId,
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
    const message =
      err instanceof Error ? err.message : "Não foi possível agendar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
