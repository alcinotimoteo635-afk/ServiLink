// Regras dos planos. O servidor decide tudo aqui; o navegador nunca envia precos nem datas.

import type { SupabaseClient } from "@supabase/supabase-js";

// Planos: ESSENCIAL (gratis, sem prazo) e PRO (pago, 90 dias). O preco e a duracao do PRO vivem na
// tabela `planos` (editaveis pelo admin) e sao SEMPRE lidos no servidor; o navegador nunca envia valores.
export type PlanoCodigo = "essencial" | "pro";
export const DIAS_PRO_PADRAO = 90;

// "destaque" e "anual" sao valores antigos: equivalem a PRO.
export const ehPlanoPro = (c: string | null | undefined) => c === "pro" || c === "destaque" || c === "anual";

export type PlanoDB = { codigo: PlanoCodigo; nome: string; descricao: string | null; preco: number; moeda: string; dias: number; ativo: boolean };

export async function lerPlano(admin: SupabaseClient, codigo: PlanoCodigo): Promise<PlanoDB | null> {
  const { data } = await admin.from("planos").select("codigo, nome, descricao, preco, moeda, dias, ativo").eq("codigo", codigo).maybeSingle();
  return (data as PlanoDB | null) ?? null;
}

export const DIAS_TESTE = 60;
export const DIA_MS = 24 * 3600 * 1000;

export type EstadoConta =
  | "pendente" | "rejeitado" | "suspenso" | "banido"
  | "gratis"            // plano Essencial gratuito (sempre visivel)
  | "teste"            // dentro dos 2 meses gratis, sem plano pago
  | "pago_antecipado"  // pagou durante o teste; o plano comeca quando o teste acaba
  | "ativo"            // plano pago em vigor
  | "expirado";        // acabou e nao pagou: perfil escondido

export type DadosPlano = {
  status: string;
  trial_fim: string | null;
  pago_ate: string | null;
  plano_codigo: string | null;
  oculto_manual: boolean;
};

export type ResumoPlano = {
  estado: EstadoConta;
  visivel: boolean;
  escondidoManual: boolean;
  fimCobertura: Date | null;
  inicioPlanoPago: Date | null; // so no pago_antecipado
  diasRestantes: number;
  podePagar: boolean;
};

// O plano ESSENCIAL e gratuito e sem fim: todo o profissional aprovado e visivel
// (a menos que o admin o esconda). Os planos pagos (Destaque / Anual) somam beneficios
// enquanto `pago_ate` estiver no futuro; depois voltam ao Essencial gratis.
export function calcularPlano(u: DadosPlano, agora = Date.now()): ResumoPlano {
  const pago = u.pago_ate ? new Date(u.pago_ate).getTime() : 0;
  const vazio = { visivel: false, escondidoManual: u.oculto_manual, fimCobertura: pago ? new Date(pago) : null, inicioPlanoPago: null, diasRestantes: 0, podePagar: false };

  if (u.status !== "aprovado") {
    return { estado: u.status as EstadoConta, ...vazio };
  }
  const visivel = !u.oculto_manual;
  if (pago > agora) {
    const dias = Math.max(0, Math.ceil((pago - agora) / DIA_MS));
    return { estado: "ativo", visivel, escondidoManual: u.oculto_manual, fimCobertura: new Date(pago), inicioPlanoPago: null, diasRestantes: dias, podePagar: dias <= 5 };
  }
  return { estado: "gratis", visivel, escondidoManual: u.oculto_manual, fimCobertura: pago ? new Date(pago) : null, inicioPlanoPago: null, diasRestantes: 0, podePagar: true };
}

export type AvisoAuto = { cor: "vermelho" | "amarelo" | "azul"; texto: string; fixo: boolean; botao?: { href: string; rotulo: string } };

// Avisos automaticos (calculados na hora, nao dependem de tarefas agendadas).
export function avisosAutomaticos(r: ResumoPlano): AvisoAuto[] {
  const lista: AvisoAuto[] = [];
  if (r.escondidoManual && r.estado !== "pendente") {
    lista.push({ cor: "vermelho", fixo: true, texto: "A tua conta está escondida pela administração. Fala com o suporte do ServiLink." });
  }
  if (r.estado === "ativo" && r.diasRestantes <= 5) {
    lista.push({
      cor: "amarelo",
      fixo: false,
      texto: `Faltam ${r.diasRestantes} ${r.diasRestantes === 1 ? "dia" : "dias"} para o teu plano acabar. Renova para manteres o destaque.`,
      botao: { href: "/planos", rotulo: "RENOVAR" },
    });
  }
  if (r.estado === "gratis" && r.fimCobertura) {
    lista.push({
      cor: "azul",
      fixo: false,
      texto: "O teu plano pago acabou. Continuas visível no plano Essencial (grátis), mas sem o destaque.",
      botao: { href: "/planos", rotulo: "VER PLANOS" },
    });
  }
  return lista;
}

export function rotuloEstado(e: EstadoConta, escondido: boolean): string {
  if (escondido && (e === "teste" || e === "ativo" || e === "pago_antecipado" || e === "expirado")) return "Escondido";
  switch (e) {
    case "gratis": return "Essencial (grátis)";
    case "pendente": return "Pendente";
    case "rejeitado": return "Recusado";
    case "suspenso": return "Suspenso";
    case "banido": return "Banido";
    case "teste": return "Em teste grátis";
    case "pago_antecipado": return "Pago (começa depois do teste)";
    case "ativo": return "Pagou";
    case "expirado": return "Em atraso";
  }
}
