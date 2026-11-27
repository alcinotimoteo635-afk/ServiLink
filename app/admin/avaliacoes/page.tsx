import { criarClienteAdmin } from "@/lib/supabase/admin";
import { fmtData } from "@/lib/datas";
import { removerAvaliacao } from "../actions";

export default async function Avaliacoes() {
  const admin = criarClienteAdmin();
  const { data } = await admin.from("reviews").select("id, profissional_id, cliente_id, nota, comentario, created_at").order("created_at", { ascending: false }).limit(100);
  const ids = Array.from(new Set((data ?? []).flatMap((r) => [r.profissional_id, r.cliente_id])));
  const nomes: Record<string, string> = {};
  if (ids.length) for (const u of (await admin.from("users").select("id, nome").in("id", ids)).data ?? []) nomes[u.id] = u.nome;
  if (!data?.length) return <p className="text-lg text-slate-700">Sem avaliações.</p>;
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-base">
          <p className="font-bold text-escuro">{r.nota}/5 · {nomes[r.cliente_id] ?? "?"} → {nomes[r.profissional_id] ?? "?"} · {fmtData(r.created_at)}</p>
          {r.comentario && <p className="mt-1">{r.comentario}</p>}
          <form action={removerAvaliacao} className="mt-2 flex flex-wrap gap-2">
            <input type="hidden" name="id" value={r.id} />
            <input name="motivo" placeholder="Motivo (opcional)" maxLength={200} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
            <button className="rounded-lg border-2 border-red-600 px-3 py-1.5 text-sm font-bold text-red-700">Remover (a média recalcula)</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
