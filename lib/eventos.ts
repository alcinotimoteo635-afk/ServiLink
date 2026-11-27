import { criarClienteAdmin } from "@/lib/supabase/admin";
import { dispositivoAtual } from "@/lib/seguranca";
import { inicioDoDiaMZ } from "@/lib/datas";

// Metricas simples e sem dados pessoais: so o hash do aparelho (cookie anonimo). Um evento igual do mesmo
// aparelho no mesmo dia conta uma vez (nao inflaciona numeros). Nunca falha a pagina.
export async function registarEvento(tipo: "visita" | "pesquisa" | "perfil", d: { categoria?: string | null; cidade?: string | null; bairro?: string | null; ref?: string } = {}) {
  try {
    const dispositivo = dispositivoAtual();
    if (!dispositivo) return;
    const admin = criarClienteAdmin();
    const ref = (d.ref ?? `${d.categoria ?? ""}|${d.cidade ?? ""}|${d.bairro ?? ""}`).slice(0, 120);
    const { data } = await admin.from("eventos").select("id").eq("tipo", tipo).eq("dispositivo_hash", dispositivo).eq("ref", ref).gte("created_at", inicioDoDiaMZ()).limit(1);
    if (data?.length) return;
    await admin.from("eventos").insert({ tipo, categoria: d.categoria ?? null, cidade: d.cidade ?? null, bairro: d.bairro ?? null, dispositivo_hash: dispositivo, ref });
  } catch { /* metricas nunca quebram o site */ }
}
