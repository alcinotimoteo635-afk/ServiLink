import { criarClienteAdmin } from "@/lib/supabase/admin";
import { fmtData } from "@/lib/datas";
import { atualizarReclamacao } from "../actions";

// Dados identificativos (nome/contacto) so aparecem aqui, para a equipa autorizada.
export default async function Reclamacoes() {
  const { data } = await criarClienteAdmin().from("reclamacoes").select("id, nome_interno, contacto_interno, texto, status, publica, resposta, created_at").order("created_at", { ascending: false }).limit(100);
  if (!data?.length) return <p className="text-lg text-slate-700">Sem reclamações.</p>;
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-base">
          <p className="font-bold text-escuro">{r.nome_interno || "(sem nome)"} · {r.contacto_interno || "(sem contacto)"} · {fmtData(r.created_at)}</p>
          <p className="mt-1 whitespace-pre-wrap">{r.texto}</p>
          <form action={atualizarReclamacao} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={r.id} />
            <select name="estado" defaultValue={r.status} className="rounded-lg border border-slate-300 px-2 py-1.5">
              <option value="nova">Nova</option><option value="em_analise">Em análise</option><option value="resolvida">Resolvida</option><option value="arquivada">Arquivada</option>
            </select>
            <input name="resposta" defaultValue={r.resposta ?? ""} maxLength={500} placeholder="Resultado / resposta" className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-1.5" />
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="publica" defaultChecked={r.publica} /> Mostrar publicamente (como SIGILO)</label>
            <button className="rounded-lg bg-primaria px-3 py-1.5 text-sm font-bold text-white">Guardar</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
