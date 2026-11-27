import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { estadoParaCliente } from "@/lib/pagamento-plano";

export const dynamic = "force-dynamic";

// O navegador pergunta ao ServiLink (nunca diretamente a SkyWallet). So o dono do pagamento.
export async function GET(req: Request) {
  const s = await obterSessao();
  if (!s || s.role !== "profissional") return NextResponse.json({ erro: "nao autorizado" }, { status: 401 });
  const orderId = new URL(req.url).searchParams.get("order_id") ?? "";
  const r = await estadoParaCliente(criarClienteAdmin(), s.id, orderId);
  if (!r) return NextResponse.json({ erro: "nao encontrado" }, { status: 404 });
  return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
}
