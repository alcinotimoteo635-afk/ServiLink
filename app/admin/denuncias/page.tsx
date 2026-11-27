import Link from "next/link";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { fmtData } from "@/lib/datas";
import { resolverDenuncia, alternarEscondido } from "../actions";

export default async function Denuncias() {
  const admin = criarClienteAdmin();
  const { data } = await admin.from("denuncias").select("id, alvo_id, motivo, status, created_at").order("created_at", { ascending: false }).limit(100);
  const ids = Array.from(new Set((data ?? []).map((d) => d.alvo_id).filter(Boolean))) as string[];
  const alvos: Record<string, { nome: string; oculto: boolean }> = {};
  if (ids.length) {
    const { data: u } = await admin.from("users").select("id, nome, oculto_manual").in("id", ids);
    for (const x of u ?? []) alvos[x.id] = { nome: x.nome, oculto: x.oculto_manual };
  }
  if (!data?.length) return <p className="text-lg text-slate-700">Não há denúncias.</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const a = d.alvo_id ? alvos[d.alvo_id] : undefined;
        return (
          <li key={d.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-base">
            <p className="font-bold text-escuro">
              {a ? <Link href={`/profissional/${d.alvo_id}`} className="text-primaria underline">{a.nome}</Link> : "(perfil apagado)"} · {d.status} · {fmtData(d.created_at)}
            </p>
            <p className="mt-1">{d.motivo}</p>
            {d.status === "aberta" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.alvo_id && a && <form action={alternarEscondido}><input type="hidden" name="id" value={d.alvo_id} /><button className="rounded-lg border-2 border-red-600 px-3 py-1.5 text-sm font-bold text-red-700">{a.oculto ? "Mostrar perfil" : "Esconder perfil"}</button></form>}
                <form action={resolverDenuncia}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="estado" value="resolvida" /><button className="rounded-lg bg-primaria px-3 py-1.5 text-sm font-bold text-white">Resolvida</button></form>
                <form action={resolverDenuncia}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="estado" value="arquivada" /><button className="rounded-lg border-2 border-slate-400 px-3 py-1.5 text-sm font-bold">Arquivar</button></form>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
