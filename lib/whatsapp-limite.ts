import type { SupabaseClient } from "@supabase/supabase-js";
import { inicioDoDiaMZ } from "@/lib/datas";
import { dispositivoAtual } from "@/lib/seguranca";
import type { Sessao } from "@/lib/sessao";

// Regra: cada visitante (conta de cliente OU aparelho, sem exigir login) so pode clicar 1 vez por dia
// (dia de Maputo) no botao "Falar no WhatsApp" de cada profissional. Depois fica transparente e bloqueado.
export const LIMITE_CLIQUES_DIA = 1;

// Ids dos profissionais que este visitante ja contactou hoje.
export async function profissionaisContactadosHoje(admin: SupabaseClient, clienteId: string | null, dispositivo: string | null): Promise<Set<string>> {
  const filtros: string[] = [];
  if (clienteId) filtros.push(`cliente_id.eq.${clienteId}`);
  if (dispositivo) filtros.push(`dispositivo_hash.eq.${dispositivo}`);
  if (!filtros.length) return new Set();
  const { data } = await admin.from("cliques_whatsapp").select("profissional_id").or(filtros.join(",")).gte("created_at", inicioDoDiaMZ());
  return new Set((data ?? []).map((c) => c.profissional_id).filter(Boolean) as string[]);
}

export const contactadosDe = (admin: SupabaseClient, sessao: Sessao | null) =>
  profissionaisContactadosHoje(admin, sessao?.role === "cliente" ? sessao.id : null, dispositivoAtual());
