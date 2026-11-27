import { criarClienteAdmin } from "@/lib/supabase/admin";
import { decifrar } from "@/lib/cripto";
import { categoriaPorSlug } from "@/lib/categorias";
import { fmtData } from "@/lib/datas";
import { aprovar, recusar } from "../actions";

export default async function Pendentes() {
  const admin = criarClienteAdmin();
  const { data } = await admin.from("users").select("id, nome, bairro, grupo, categoria, descricao, foto_url, whatsapp_enc, duplicado_de, created_at")
    .eq("role", "profissional").eq("status", "pendente").order("created_at");
  const lista = data ?? [];
  const idsDup = lista.map((u) => u.duplicado_de).filter(Boolean) as string[];
  const nomesDup: Record<string, string> = {};
  if (idsDup.length) {
    const { data: d } = await admin.from("users").select("id, nome").in("id", idsDup);
    for (const x of d ?? []) nomesDup[x.id] = x.nome;
  }
  if (!lista.length) return <p className="text-lg text-slate-700">Não há contas à espera de aprovação.</p>;
  return (
    <ul className="space-y-4">
      {lista.map((u) => {
        let tel = "";
        try { tel = u.whatsapp_enc ? decifrar(u.whatsapp_enc) : ""; } catch { tel = ""; }
        return (
          <li key={u.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            {u.duplicado_de && (
              <p className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-base font-bold text-red-800">
                ⚠️ Possível conta duplicada de {nomesDup[u.duplicado_de] ?? "outra conta"}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              {u.foto_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={u.foto_url} alt={`Foto de ${u.nome}`} className="h-24 w-24 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1 text-base">
                <p className="text-xl font-bold text-escuro">{u.nome}</p>
                <p>{u.grupo === "digital" ? "Serviços Digitais" : "Técnico ao Domicílio"} · {categoriaPorSlug(u.categoria)?.nome ?? u.categoria} · {u.bairro}</p>
                <p className="mt-1">{u.descricao}</p>
                <p className="mt-1">WhatsApp: {tel ? <a className="font-bold text-primaria underline" href={`tel:+258${tel}`}>+258 {tel}</a> : "-"} · Criada: {fmtData(u.created_at)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={aprovar}><input type="hidden" name="id" value={u.id} /><button className="rounded-xl bg-whats px-5 py-2 text-base font-bold text-white">Aprovar</button></form>
              <form action={recusar} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <input name="motivo" placeholder="Motivo (opcional)" maxLength={200} className="rounded-lg border border-slate-300 px-3 py-2 text-base" />
                <button className="rounded-xl border-2 border-red-600 px-5 py-2 text-base font-bold text-red-700">Recusar</button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
