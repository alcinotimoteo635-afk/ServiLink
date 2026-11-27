import Link from "next/link";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { fmtData, mt } from "@/lib/datas";

const ROTULO: Record<string, string> = { pendente: "Pendente", indeterminado: "A confirmar", confirmado: "Confirmado", falhou: "Falhado" };

// So leitura. O admin NAO transforma pendente em confirmado: so o servidor, com assinatura valida ou consulta autenticada.
export default async function Pagamentos({ searchParams }: { searchParams: { estado?: string; q?: string } }) {
  const admin = criarClienteAdmin();
  let q = admin.from("pagamentos_plano").select("id, user_id, valor, moeda, numero_mascarado, referencia, status, erro_mensagem, created_at, confirmado_em, periodo_fim").order("created_at", { ascending: false }).limit(150);
  const f = searchParams.estado;
  if (f === "pendente") q = q.in("status", ["pendente", "indeterminado"]);
  else if (f === "confirmado" || f === "falhou") q = q.eq("status", f);
  const { data } = await q;
  const ids = Array.from(new Set((data ?? []).map((p) => p.user_id).filter(Boolean))) as string[];
  const nomes: Record<string, string> = {};
  if (ids.length) {
    const { data: u } = await admin.from("users").select("id, nome").in("id", ids);
    for (const x of u ?? []) nomes[x.id] = x.nome;
  }
  const termo = (searchParams.q ?? "").toLowerCase().trim();
  const linhas = (data ?? []).filter((p) => !termo || (p.user_id && (nomes[p.user_id] ?? "").toLowerCase().includes(termo)) || p.referencia.toLowerCase().includes(termo));
  return (
    <div>
      <form className="mb-4 flex flex-wrap items-center gap-2">
        {[["", "Todos"], ["pendente", "Pendentes"], ["confirmado", "Confirmados"], ["falhou", "Falhados"]].map(([v, r]) => (
          <Link key={v} href={`/admin/pagamentos${v ? `?estado=${v}` : ""}`} className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold ${(f ?? "") === v ? "border-primaria bg-primaria text-white" : "border-slate-300"}`}>{r}</Link>
        ))}
        <input name="q" defaultValue={searchParams.q} placeholder="Profissional ou order_id" className="rounded-lg border border-slate-300 px-3 py-1.5 text-base" />
        {f && <input type="hidden" name="estado" value={f} />}
        <button className="rounded-lg bg-primaria px-3 py-1.5 text-sm font-bold text-white">Procurar</button>
      </form>
      {!linhas.length ? <p className="text-lg text-slate-700">Sem pagamentos.</p> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-base">
            <thead className="bg-hero text-escuro"><tr>{["Criado", "Profissional", "Valor", "Número", "order_id", "Estado", "Confirmado", "PRO até"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {linhas.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2">{fmtData(p.created_at)}</td>
                  <td className="px-3 py-2">{p.user_id ? nomes[p.user_id] ?? "(apagado)" : "(apagado)"}</td>
                  <td className="px-3 py-2">{mt(p.valor)}</td>
                  <td className="px-3 py-2">{p.numero_mascarado}</td>
                  <td className="px-3 py-2 font-mono text-sm">{p.referencia}</td>
                  <td className="px-3 py-2 font-bold">{ROTULO[p.status] ?? p.status}{p.status === "falhou" && p.erro_mensagem ? <span className="block text-sm font-normal text-slate-600">{p.erro_mensagem}</span> : null}</td>
                  <td className="px-3 py-2">{p.confirmado_em ? fmtData(p.confirmado_em) : "-"}</td>
                  <td className="px-3 py-2">{p.periodo_fim ? fmtData(p.periodo_fim).slice(0, 10) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
