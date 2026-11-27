import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularPlano, lerPlano } from "@/lib/plano";
import { consultarEstado, mensagemSegura, normalizarMsisdn, novoOrderId, pedirPagamento, skywalletConfigurado } from "@/lib/skywallet";
import { mascarar } from "@/lib/validar";

export type ResultadoCobranca = { ok: boolean; erro?: string; orderId?: string; pendente?: boolean };

export const opcoesPagamento = () => ({ disponivel: skywalletConfigurado() });

type Pagamento = {
  id: string; user_id: string | null; status: string; referencia: string; valor: number; moeda: string | null; created_at: string; atualizado_em?: string | null;
};
const COLUNAS = "id, user_id, status, referencia, valor, moeda, created_at, atualizado_em";

async function registar(admin: SupabaseClient, orderId: string, origem: string, estado: string | null, resultado: string, detalhe?: string) {
  await admin.from("eventos_pagamento").insert({ order_id: orderId, origem, estado, resultado, detalhe: detalhe?.slice(0, 200) ?? null });
}

async function ativar(admin: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await admin.rpc("ativar_pagamento_plano", { p_id: id });
  if (error) console.error("[pagamento] ativacao falhou:", error.message);
  return data === true;
}

async function marcarFalhado(admin: SupabaseClient, id: string, erro: string) {
  // So transiciona de pendente/indeterminado: um pagamento confirmado nunca regride.
  await admin.from("pagamentos_plano").update({ status: "falhou", erro_mensagem: mensagemSegura(erro), atualizado_em: new Date().toISOString() }).eq("id", id).in("status", ["pendente", "indeterminado"]);
}

// Aplica um estado JA AUTENTICADO (webhook com assinatura valida ou consulta autenticada a SkyWallet).
export async function aplicarEstado(
  admin: SupabaseClient,
  pg: Pagamento,
  r: { estado: "pending" | "success" | "failed"; erro?: string; amount?: number; currency?: string },
  origem: "webhook" | "consulta"
): Promise<"confirmado" | "falhou" | "pendente" | "rejeitado"> {
  if (pg.status === "confirmado") { await registar(admin, pg.referencia, origem, r.estado, "duplicado"); return "confirmado"; }

  if (r.estado === "success") {
    // O valor e a moeda tem de coincidir com o que guardamos no momento da compra.
    if ((r.amount !== undefined && r.amount !== Number(pg.valor)) || (r.currency && r.currency !== (pg.moeda ?? "MZN"))) {
      await registar(admin, pg.referencia, origem, r.estado, "rejeitado", "valor ou moeda diferentes");
      return "rejeitado";
    }
    const ok = await ativar(admin, pg.id);
    await registar(admin, pg.referencia, origem, r.estado, ok ? "ativado" : "falhou");
    return ok ? "confirmado" : "pendente";
  }
  if (r.estado === "failed") {
    await marcarFalhado(admin, pg.id, r.erro ?? "");
    await registar(admin, pg.referencia, origem, r.estado, "falhou");
    return pg.status === "falhou" ? "falhou" : "falhou";
  }
  return "pendente";
}

// Pergunta a SkyWallet e age. "null" (rede/limite) nunca vira falha.
export async function reconciliar(admin: SupabaseClient, pg: Pagamento): Promise<"confirmado" | "falhou" | "pendente" | "rejeitado"> {
  if (pg.status === "confirmado") return "confirmado";
  if (pg.status === "falhou") return "falhou";
  const r = await consultarEstado(pg.referencia);
  if (!r) return "pendente";
  await admin.from("pagamentos_plano").update({ atualizado_em: new Date().toISOString() }).eq("id", pg.id);
  return aplicarEstado(admin, pg, r, "consulta");
}

export async function reconciliarPendentes(admin: SupabaseClient, userId?: string): Promise<void> {
  if (!skywalletConfigurado()) return;
  let q = admin.from("pagamentos_plano").select(COLUNAS).in("status", ["pendente", "indeterminado"]);
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q.limit(30);
  for (const pg of (data ?? []) as Pagamento[]) {
    if (Date.now() - new Date(pg.created_at).getTime() < 20_000) continue; // ainda a decorrer
    await reconciliar(admin, pg);
  }
}

export async function iniciarCobranca(admin: SupabaseClient, p: { userId: string; numero: string }): Promise<ResultadoCobranca> {
  if (!skywalletConfigurado()) {
    console.error("[pagamento] SKYWALLET_SK_ID / SKYWALLET_API_KEY / SKYWALLET_WEBHOOK_SECRET em falta");
    return { ok: false, erro: "Os pagamentos ainda não estão disponíveis. Tenta mais tarde." };
  }
  const msisdn = normalizarMsisdn(p.numero);
  if (!msisdn) return { ok: false, erro: "Número M-Pesa inválido. Usa um número que comece por 84 ou 85." };

  // Regras SEMPRE lidas da base de dados.
  const { data: u } = await admin.from("users").select("role, status, pago_ate, plano_codigo, trial_fim, oculto_manual").eq("id", p.userId).single();
  if (!u || u.role !== "profissional" || u.status !== "aprovado") return { ok: false, erro: "Só profissionais aprovados podem comprar o plano PRO." };

  const plano = await lerPlano(admin, "pro");
  if (!plano || !plano.ativo || plano.preco <= 0 || plano.moeda !== "MZN") return { ok: false, erro: "O plano PRO não está disponível neste momento." };

  // Pedido anterior em curso? Verifica antes de criar outro (evita cobrar duas vezes).
  const { data: aberto } = await admin.from("pagamentos_plano").select(COLUNAS).eq("user_id", p.userId).in("status", ["pendente", "indeterminado"]).maybeSingle();
  if (aberto) {
    const r = await reconciliar(admin, aberto as Pagamento);
    if (r === "pendente") return { ok: false, pendente: true, orderId: (aberto as Pagamento).referencia, erro: "Já tens um pagamento a aguardar confirmação. Confirma-o no telemóvel ou espera um pouco." };
    if (r === "confirmado") return { ok: false, erro: "O teu pagamento anterior acabou de ser confirmado." };
  }

  const resumo = calcularPlano(u);
  if (!resumo.podePagar) return { ok: false, erro: "O teu PRO ainda tem muitos dias. Podes renovar nos últimos 5 dias." };

  const orderId = novoOrderId();
  const { data: novo, error } = await admin.from("pagamentos_plano").insert({
    user_id: p.userId, plano_codigo: "pro", valor: plano.preco, moeda: plano.moeda, metodo: "mpesa", provider: "skywallet",
    numero_mascarado: mascarar(msisdn), referencia: orderId, status: "pendente", modo: "real",
  }).select(COLUNAS).single();
  if (error || !novo) {
    // Violacao do indice "um pagamento em curso" = clique duplicado.
    return { ok: false, erro: "Já existe um pagamento em curso. Espera um momento." };
  }

  const r = await pedirPagamento({ msisdn, amount: plano.preco, description: `Subscricao ServiLink PRO - ${plano.dias} dias`, orderId });
  if (r.resultado === "rejeitado") {
    await marcarFalhado(admin, novo.id, r.erro);
    return { ok: false, erro: r.erro };
  }
  if (r.resultado === "limite") {
    await marcarFalhado(admin, novo.id, "Muitos pedidos. Tenta de novo daqui a um minuto.");
    return { ok: false, erro: "Muitos pedidos neste momento. Tenta de novo daqui a um minuto." };
  }
  if (r.resultado === "incerto") {
    // Pode ter sido enviado: nao falhar nem repetir. Fica a aguardar e e consultado pelo estado.
    await admin.from("pagamentos_plano").update({ status: "indeterminado", atualizado_em: new Date().toISOString() }).eq("id", novo.id);
    return { ok: true, orderId };
  }
  return { ok: true, orderId };
}

// Estado seguro para o navegador (so o dono do pagamento).
export async function estadoParaCliente(admin: SupabaseClient, userId: string, orderId: string) {
  if (!/^[A-Za-z0-9]{1,20}$/.test(orderId)) return null;
  const { data } = await admin.from("pagamentos_plano").select(`${COLUNAS}, erro_mensagem`).eq("referencia", orderId).eq("user_id", userId).maybeSingle();
  if (!data) return null;
  let pg = data as Pagamento & { erro_mensagem: string | null };
  if (pg.status === "pendente" || pg.status === "indeterminado") {
    const ultima = new Date(pg.atualizado_em ?? pg.created_at).getTime();
    if (Date.now() - ultima > 4000) {
      await reconciliar(admin, pg);
      const { data: novo } = await admin.from("pagamentos_plano").select(`${COLUNAS}, erro_mensagem`).eq("id", pg.id).single();
      if (novo) pg = novo as typeof pg;
    }
  }
  const estado = pg.status === "confirmado" ? "success" : pg.status === "falhou" ? "failed" : "pending";
  return { estado, mensagem: estado === "failed" ? pg.erro_mensagem ?? "O pagamento não foi concluído." : null };
}
