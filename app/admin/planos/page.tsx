import { criarClienteAdmin } from "@/lib/supabase/admin";
import { lerPlano } from "@/lib/plano";
import { skywalletConfigurado } from "@/lib/skywallet";
import { PLANOS_VISIVEIS } from "@/lib/config";
import { atualizarPlanoPro } from "../actions";

export default async function PlanoPro() {
  const pro = await lerPlano(criarClienteAdmin(), "pro");
  const sw = skywalletConfigurado();
  return (
    <div className="max-w-xl space-y-4 text-base">
      <p className="rounded-xl bg-hero p-3 text-escuro">
        SkyWallet: <strong>{sw ? "credenciais configuradas" : "credenciais em falta (SKYWALLET_SK_ID, SKYWALLET_API_KEY, SKYWALLET_WEBHOOK_SECRET)"}</strong> · Planos no site: <strong>{PLANOS_VISIVEIS ? "visíveis" : "escondidos (lib/config.ts)"}</strong>
      </p>
      {!pro ? <p className="text-red-700">Plano PRO não encontrado. Corre a migração supabase/migracao-v3.sql.</p> : (
        <form action={atualizarPlanoPro} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-escuro">Plano PRO · {pro.dias} dias</h2>
          <label className="block font-bold text-escuro" htmlFor="preco">Preço (MT)</label>
          <input id="preco" name="preco" type="number" min={1} max={1000000} defaultValue={pro.preco} required className="h-12 w-40 rounded-xl border-2 border-slate-300 px-3" />
          <label className="flex items-center gap-2"><input type="checkbox" name="ativo" defaultChecked={pro.ativo} className="h-5 w-5" /> Plano disponível para compra</label>
          <button className="rounded-xl bg-primaria px-6 py-3 font-bold text-white">Guardar</button>
          <p className="text-sm text-slate-600">O novo preço vale para os próximos pagamentos. Pagamentos já feitos mantêm o valor da compra.</p>
        </form>
      )}
    </div>
  );
}
