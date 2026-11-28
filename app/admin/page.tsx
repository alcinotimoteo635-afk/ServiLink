import { criarClienteAdmin } from "@/lib/supabase/admin";
import { isCaptchaConfigured, isSkyWalletConfigured } from "@/lib/config";
import { calcularPlano } from "@/lib/plano";
import { categoriaPorSlug } from "@/lib/categorias";

const topo = (itens: (string | null)[], n = 5) => {
  const m = new Map<string, number>();
  for (const i of itens) if (i) m.set(i, (m.get(i) ?? 0) + 1);
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
};

export default async function Resumo() {
  const admin = criarClienteAdmin();
  const head = { count: "exact" as const, head: true };
  const cont = async (q: any) => (await q).count ?? 0;
  const desde = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [pendentes, clientes, profs, aprovados, cliques, denuncias, reclamacoes, { data: ev }, { data: pros }] = await Promise.all([
    cont(admin.from("users").select("id", head).eq("role", "profissional").eq("status", "pendente")),
    cont(admin.from("users").select("id", head).eq("role", "cliente")),
    cont(admin.from("users").select("id", head).eq("role", "profissional")),
    cont(admin.from("users").select("id", head).eq("role", "profissional").eq("status", "aprovado")),
    cont(admin.from("cliques_whatsapp").select("id", head).gte("created_at", desde)),
    cont(admin.from("denuncias").select("id", head).eq("status", "aberta")),
    cont(admin.from("reclamacoes").select("id", head).eq("status", "nova")),
    admin.from("eventos").select("tipo, categoria, cidade, bairro, dispositivo_hash").gte("created_at", desde).limit(10000),
    admin.from("users").select("status, trial_fim, pago_ate, plano_codigo, oculto_manual").eq("role", "profissional"),
  ]);
  const e = ev ?? [];
  const visitantes = new Set(e.filter((x) => x.tipo === "visita" && x.dispositivo_hash).map((x) => x.dispositivo_hash)).size;
  const pesquisas = e.filter((x) => x.tipo === "pesquisa");
  let pagos = 0, gratis = 0;
  for (const p of pros ?? []) {
    const c = calcularPlano(p as any);
    if (c.estado === "ativo") pagos++; else if (c.estado === "gratis") gratis++;
  }

  const cartoes: [string, number][] = [
    ["Pendentes de aprovação", pendentes], ["Profissionais aprovados", aprovados], ["Profissionais (total)", profs], ["Clientes", clientes],
    ["PRO ativos", pagos], ["No plano grátis", gratis], ["Reclamações novas", reclamacoes], ["Denúncias abertas", denuncias],
  ];
  const metricas: [string, number][] = [
    ["Visitantes (30 dias)", visitantes], ["Perfis visualizados", e.filter((x) => x.tipo === "perfil").length],
    ["Pesquisas", pesquisas.length], ["Cliques no WhatsApp", cliques],
  ];
  const listas: [string, [string, number][]][] = [
    ["Categorias mais procuradas", topo(pesquisas.map((x) => x.categoria)).map(([k, n]) => [categoriaPorSlug(k)?.nome ?? k, n])],
    ["Cidades mais pesquisadas", topo(pesquisas.map((x) => x.cidade))],
    ["Bairros mais pesquisados", topo(pesquisas.map((x) => x.bairro))],
  ];
  const caixa = "rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4";
  const numero = "text-2xl font-extrabold text-primaria sm:text-3xl";
  const legenda = "text-xs text-slate-700 sm:text-base";
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {cartoes.map(([t, n]) => <div key={t} className={caixa}><p className={numero}>{n}</p><p className={legenda}>{t}</p></div>)}
      </div>
      <h2 className="mt-5 text-lg font-bold text-escuro sm:mt-8 sm:text-xl">Últimos 30 dias</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3 md:grid-cols-4">
        {metricas.map(([t, n]) => <div key={t} className={caixa}><p className={numero}>{n}</p><p className={legenda}>{t}</p></div>)}
      </div>
      <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 md:grid-cols-3">
        {listas.map(([t, l]) => (
          <div key={t} className={caixa}>
            <p className="text-sm font-bold text-escuro sm:text-base">{t}</p>
            {l.length ? <ol className="mt-2 space-y-1 text-sm sm:text-base">{l.map(([k, n]) => <li key={k} className="flex justify-between"><span>{k}</span><strong>{n}</strong></li>)}</ol> : <p className="mt-2 text-sm text-slate-600 sm:text-base">Sem dados ainda.</p>}
          </div>
        ))}
      </div>
      {/* Cartoes pequenos e limpos. As chaves vao na Vercel: Settings > Environment Variables (ver lib/config.ts). */}
      {(!isSkyWalletConfigured() || !isCaptchaConfigured()) && (
        <div className="mt-4 grid gap-2 sm:mt-6 sm:grid-cols-2">
          {!isSkyWalletConfigured() && (
            <div className={caixa}>
              <p className="text-sm font-bold text-escuro sm:text-base">Pagamentos em breve</p>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">Configurar SkyWallet na Vercel: Settings &gt; Environment Variables.</p>
            </div>
          )}
          {!isCaptchaConfigured() && (
            <div className={caixa}>
              <p className="text-sm font-bold text-escuro sm:text-base">Captcha desligado</p>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">Os formulários funcionam sem captcha. Para ligar, configura o Turnstile na Vercel.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
