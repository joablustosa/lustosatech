import { NextResponse } from "next/server";
import { auth } from "./auth";

export interface SessionInfo {
  userId: string;
  tenantId: string;
  role: string;
}

/**
 * Garante que há um usuário logado e retorna os dados da sessão
 * (userId, tenantId, role). Se não houver, retorna uma resposta 401.
 */
export async function requireSession(): Promise<SessionInfo | NextResponse> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  };
}

/** Igual a requireSession, mas exige papel de admin do tenant. */
export async function requireAdmin(): Promise<SessionInfo | NextResponse> {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;
  if (s.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem executar esta ação" },
      { status: 403 }
    );
  }
  return s;
}
