import { criarClienteAdmin } from "@/lib/supabase/admin";
import { calcularPlano, rotuloEstado, ehPlanoPro } from "@/lib/plano";
import { categoriaPorSlug } from "@/lib/categorias";
import { decifrar } from "@/lib/cripto";
import { fmtData } from "@/lib/datas";
import AdminSenha from "@/components/AdminSenha";
import { alternarEscondido, alternarVerificado, mudarEstado, enviarAviso, removerAviso, destacarNaInicial, apagarConta } from "../actions";

type Busca = { q?: string; estado?: string };
const ESTADOS = ["", "Pagou", "Grátis", "Escondido"];

export default async function Profissionais({ searchParams }: { searchParams: Busca }) {
  const admin = criarClienteAdmin();
  const [{ data: pros }, { data: cliques }, { data: avisos }] = await Promise.all([
    admin.from("users").select("id, nome, bairro, grupo, categoria, whatsapp_enc, status, verificado, oculto_manual, trial_fim, pago_ate, plano_codigo, home_destaque_mes, created_at").eq("role", "profissional").in("status", ["aprovado", "suspenso", "banido", "rejeitado"]).order("created_at", { ascending: false }),
    admin.from("v_cliques").select("profissional_id, total, ultimos_7_dias"),
    admin.from("avisos").select("id, user_id, cor, texto").eq("ativo", true),
  ]);
  const cl = new Map((cliques ?? []).map((c) => [c.profissional_id, c]));
  const q = (searchParams.q ?? "").toLowerCase().trim();

  const linhas = (pros ?? []).map((p) => {
    const r = calcularPlano(p as any);
    return { p, r, rotulo: rotuloEstado(r.estado, p.oculto_manual) };
  }).filter(({ p, rotulo }) => {
    if (q && !`${p.nome} ${p.bairro} ${p.categoria}`.toLowerCase().includes(q)) return false;
    const e = searchParams.estado;
    if (e === "Pagou") return rotulo === "Pagou" || rotulo.startsWith("Pago");
    if (e === "Grátis") return rotulo === "Essencial (grátis)";
    if (e === "Escondido") return rotulo === "Escondido";
    return true;
  });

  return (
    <div>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q} placeholder="Procurar nome, bairro, categoria" className="rounded-lg border border-slate-300 px-3 py-2 text-base" />
        <select name="estado" defaultValue={searchParams.estado ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-base">
          {ESTADOS.map((e) => <option key={e} value={e}>{e || "Todos os estados"}</option>)}
        </select>
        <button className="rounded-lg bg-primaria px-4 py-2 text-base font-bold text-white">Filtrar</button>
      </form>
      <p className="mb-3 text-base text-slate-700">{linhas.length} profissionais</p>
      <ul className="space-y-4">
        {linhas.map(({ p, r, rotulo }) => {
          const c = cl.get(p.id);
          const av = (avisos ?? []).filter((a) => a.user_id === p.id);
          let tel = "";
          try { tel = p.whatsapp_enc ? decifrar(p.whatsapp_enc) : ""; } catch { tel = ""; }
          return (
            <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-base">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold text-escuro">{p.nome} {p.verificado && <span className="text-sm text-verificado">✔ Verificado</span>}</p>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${rotulo === "Escondido" ? "bg-red-100 text-red-800" : rotulo === "Essencial (grátis)" ? "bg-slate-100 text-slate-800" : "bg-emerald-100 text-emerald-900"}`}>{rotulo}</span>
              </div>
              <p className="text-slate-700">
                [{p.status}] {p.grupo === "digital" ? "Digital" : "Domicílio"} · {categoriaPorSlug(p.categoria)?.nome ?? p.categoria} · {p.bairro} · {tel ? `+258 ${tel}` : "-"}
              </p>
              <p className="mt-1">
                Cliques WhatsApp: <strong>{c?.total ?? 0}</strong> (7 dias: {c?.ultimos_7_dias ?? 0}) · Dias do plano pago: <strong>{r.diasRestantes}</strong> · Plano: {r.estado === "ativo" && ehPlanoPro(p.plano_codigo) ? "PRO" : "Essencial"}{r.estado === "ativo" ? ` · até ${fmtData(r.fimCobertura?.toISOString())}` : ""}
              </p>
              {av.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {av.map((a) => (
                    <li key={a.id} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1 ${a.cor === "vermelho" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>
                      <span>{a.texto}</span>
                      <form action={removerAviso}><input type="hidden" name="id" value={a.id} /><button className="text-sm font-bold underline">Remover</button></form>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={alternarEscondido}><input type="hidden" name="id" value={p.id} /><button className="rounded-lg border-2 border-slate-400 px-3 py-1.5 text-sm font-bold">{p.oculto_manual ? "Mostrar" : "Esconder"}</button></form>
                <form action={alternarVerificado}><input type="hidden" name="id" value={p.id} /><button className="rounded-lg border-2 border-slate-400 px-3 py-1.5 text-sm font-bold">{p.verificado ? "Tirar selo" : "Dar selo Verificado"}</button></form>
                {r.estado === "ativo" && ehPlanoPro(p.plano_codigo) && (
                  <form action={destacarNaInicial}><input type="hidden" name="id" value={p.id} /><button className="rounded-lg border-2 border-primaria px-3 py-1.5 text-sm font-bold text-primaria">Destacar na inicial este mês{p.home_destaque_mes ? ` (último: ${p.home_destaque_mes})` : ""}</button></form>
                )}
                <AdminSenha id={p.id} />
              </div>
              <form action={mudarEstado} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="id" value={p.id} />
                <input name="motivo" maxLength={200} placeholder="Motivo (obrigatório para suspender/banir)" className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-base" />
                {p.status === "aprovado" && <button name="estado" value="suspenso" className="rounded-lg border-2 border-amber-500 px-3 py-1.5 font-bold text-amber-800">Suspender</button>}
                {p.status !== "banido" && <button name="estado" value="banido" className="rounded-lg border-2 border-red-600 px-3 py-1.5 font-bold text-red-700">Banir</button>}
                {(p.status === "suspenso" || p.status === "banido") && <button name="estado" value="aprovado" className="rounded-lg border-2 border-emerald-600 px-3 py-1.5 font-bold text-emerald-800">Reativar</button>}
              </form>
              <form action={enviarAviso} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="user_id" value={p.id} />
                <input name="texto" required minLength={3} maxLength={500} placeholder="Texto do aviso" className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-base" />
                <select name="cor" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"><option value="vermelho">Vermelho (fixo)</option><option value="verde">Verde (pode fechar)</option></select>
                <button className="rounded-lg bg-primaria px-3 py-1.5 text-sm font-bold text-white">Enviar Aviso</button>
              </form>
              <form action={apagarConta} className="mt-3 flex items-center gap-2 text-sm">
                <input type="hidden" name="id" value={p.id} />
                <label className="flex items-center gap-1"><input type="checkbox" name="confirmo" required /> Confirmo apagar esta conta</label>
                <button className="rounded-lg border-2 border-red-600 px-3 py-1 font-bold text-red-700">Apagar conta</button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
