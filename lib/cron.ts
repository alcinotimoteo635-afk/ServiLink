import { NextResponse } from "next/server";

// A Vercel Cron envia "Authorization: Bearer <CRON_SECRET>" quando CRON_SECRET esta definido.
export function validarCron(req: Request): NextResponse | null {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return NextResponse.json({ erro: "CRON_SECRET nao configurado" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  }
  return null;
}
