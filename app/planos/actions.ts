"use server";

import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { iniciarCobranca } from "@/lib/pagamento-plano";
import { minutosBloqueado, registarFalha } from "@/lib/seguranca";

export type Estado = { erro?: string; orderId?: string } | null;

// O preco, a duracao e o plano NUNCA vem do navegador: so o numero M-Pesa.
export async function pagarPlano(_a: Estado, form: FormData): Promise<Estado> {
  const s = await obterSessao();
  if (!s || s.role !== "profissional" || s.status !== "aprovado") {
    return { erro: "Entra como profissional aprovado para comprar o PRO." };
  }
  if (form.get("confirmo") !== "on") return { erro: "Confirma o valor e a duração para continuar." };

  const admin = criarClienteAdmin();
  const chave = `pagar:${s.id}`;
  const bloqueio = await minutosBloqueado(admin, chave);
  if (bloqueio) return { erro: `Muitas tentativas de pagamento. Tenta de novo em ${bloqueio} minutos.` };
  await registarFalha(admin, chave, 10);

  const r = await iniciarCobranca(admin, { userId: s.id, numero: String(form.get("numero") ?? "") });
  if (!r.ok && !r.pendente) return { erro: r.erro };
  return { orderId: r.orderId, erro: r.ok ? undefined : r.erro };
}
