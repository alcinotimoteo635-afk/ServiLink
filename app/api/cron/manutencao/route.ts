import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { reconciliarPendentes } from "@/lib/pagamento-plano";
import { validarCron } from "@/lib/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Diario. A visibilidade dos perfis e os avisos NAO dependem desta tarefa (sao calculados na
// hora). Aqui: confirmar pagamentos que ficaram por confirmar e limpar tentativas de login antigas.
export async function GET(req: Request) {
  const negado = validarCron(req);
  if (negado) return negado;
  const admin = criarClienteAdmin();

  await reconciliarPendentes(admin);
  // Subscricoes terminadas ficam marcadas como expiradas (a visibilidade PRO ja e calculada pela data).
  await admin.from("subscricoes").update({ status: "expirada" }).eq("status", "ativa").lt("expires_at", new Date().toISOString());
  const limite = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  await admin.from("login_tentativas").delete().lt("atualizado_em", limite);

  return NextResponse.json({ ok: true });
}
