import { criarClienteAdmin } from "@/lib/supabase/admin";
import { decifrar } from "@/lib/cripto";
import { fmtData } from "@/lib/datas";
import AdminSenha from "@/components/AdminSenha";
import { apagarConta } from "../actions";

export default async function Clientes() {
  const { data } = await criarClienteAdmin().from("users").select("id, nome, bairro, whatsapp_enc, created_at").eq("role", "cliente").order("created_at", { ascending: false }).limit(200);
  if (!data?.length) return <p className="text-lg text-slate-700">Ainda não há clientes.</p>;
  return (
    <ul className="space-y-3">
      {data.map((c) => {
        let tel = "";
        try { tel = c.whatsapp_enc ? decifrar(c.whatsapp_enc) : ""; } catch { tel = ""; }
        return (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-base">
            <div>
              <p className="font-bold text-escuro">{c.nome}</p>
              <p className="text-slate-700">{c.bairro} · {tel ? `+258 ${tel}` : "-"} · {fmtData(c.created_at)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminSenha id={c.id} />
              <form action={apagarConta} className="flex items-center gap-2 text-sm">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex items-center gap-1"><input type="checkbox" name="confirmo" required /> Confirmo</label>
                <button className="rounded-lg border-2 border-red-600 px-3 py-1 font-bold text-red-700">Apagar</button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
