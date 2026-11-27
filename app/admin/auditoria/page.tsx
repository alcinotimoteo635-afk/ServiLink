import { criarClienteAdmin } from "@/lib/supabase/admin";
import { fmtData } from "@/lib/datas";

export default async function Auditoria() {
  const admin = criarClienteAdmin();
  const { data } = await admin.from("auditoria_admin").select("id, admin_id, acao, alvo_nome, motivo, created_at").order("created_at", { ascending: false }).limit(200);
  const ids = Array.from(new Set((data ?? []).map((a) => a.admin_id).filter(Boolean))) as string[];
  const nomes: Record<string, string> = {};
  if (ids.length) for (const u of (await admin.from("users").select("id, nome").in("id", ids)).data ?? []) nomes[u.id] = u.nome;
  if (!data?.length) return <p className="text-lg text-slate-700">Ainda não há ações registadas.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-base">
        <thead className="bg-hero text-escuro"><tr>{["Data", "Admin", "Ação", "Utilizador", "Motivo"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-slate-100 align-top">
              <td className="px-3 py-2">{fmtData(a.created_at)}</td>
              <td className="px-3 py-2">{a.admin_id ? nomes[a.admin_id] ?? "?" : "-"}</td>
              <td className="px-3 py-2 font-bold">{a.acao}</td>
              <td className="px-3 py-2">{a.alvo_nome ?? "-"}</td>
              <td className="px-3 py-2">{a.motivo ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
