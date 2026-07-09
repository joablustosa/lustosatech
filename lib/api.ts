import { NextResponse } from "next/server";
import { auth } from "./auth";

/** Garante que há um admin logado. Retorna null se ok, ou uma resposta 401. */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}
