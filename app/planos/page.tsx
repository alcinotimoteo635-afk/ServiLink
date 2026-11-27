import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { PLANOS_VISIVEIS } from "@/lib/config";
import { calcularPlano, lerPlano } from "@/lib/plano";
import { BENEFICIOS_ESSENCIAL, BENEFICIOS_PRO } from "@/lib/planos-texto";
import { opcoesPagamento, reconciliarPendentes } from "@/lib/pagamento-plano";
import { fmtData } from "@/lib/datas";
import FormPagamento from "@/components/FormPagamento";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos - ServiLink" };

const dia = (d: Date | null) => (d ? fmtData(d.toISOString()).slice(0, 10) : "-");

export default async function Planos({ searchParams }: { searchParams: { pedido?: string } }) {
  if (!PLANOS_VISIVEIS) redirect("/");
  const sessao = await obterSessao();
  const ehPro = sessao?.role === "profissional" && sessao.status === "aprovado";
  const admin = criarClienteAdmin();
  const pro = await lerPlano(admin, "pro");
  const op = opcoesPagamento();

  let resumo = null;
  let pedido: string | undefined;
  if (ehPro && sessao) {
    await reconciliarPendentes(admin, sessao.id);
    const { data: u } = await admin.from("users").select("status, trial_fim, pago_ate, plano_codigo, oculto_manual").eq("id", sessao.id).single();
    if (u) resumo = calcularPlano(u);
    const { data: aberto } = await admin.from("pagamentos_plano").select("referencia").eq("user_id", sessao.id).in("status", ["pendente", "indeterminado"]).maybeSingle();
    pedido = aberto?.referencia ?? (/^[A-Za-z0-9]{1,20}$/.test(searchParams.pedido ?? "") ? searchParams.pedido : undefined);
  }
  const podeComprar = ehPro && (resumo?.podePagar || pedido);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-[32px] font-extrabold leading-tight text-escuro md:text-[48px]">Planos para profissionais</h1>
      <p className="mt-2 text-lg text-slate-700">Os mesmos planos para Serviços Digitais e Técnico ao Domicílio. Sem comissão: o cliente fala contigo direto no WhatsApp.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
          <span className="text-xl font-extrabold text-escuro">Essencial</span>
          <p className="mt-1 text-3xl font-extrabold text-primaria">Grátis</p>
          <ul className="mt-3 space-y-2 text-base text-texto">
            {BENEFICIOS_ESSENCIAL.map((b) => <li key={b} className="flex gap-2"><Check className="mt-0.5 h-5 w-5 shrink-0 text-verificado" aria-hidden="true" />{b}</li>)}
          </ul>
        </div>
        {pro && pro.ativo && (
          <div className="rounded-2xl border-2 border-[#FFB800] bg-white p-5">
            <span className="text-xl font-extrabold text-escuro">{pro.nome}</span>
            <p className="mt-1 text-3xl font-extrabold text-primaria">{pro.preco.toLocaleString("pt-MZ")} MT <span className="text-base font-medium text-slate-600">/ {pro.dias} dias</span></p>
            <ul className="mt-3 space-y-2 text-base text-texto">
              {BENEFICIOS_PRO.map((b) => <li key={b} className="flex gap-2"><Check className="mt-0.5 h-5 w-5 shrink-0 text-verificado" aria-hidden="true" />{b}</li>)}
            </ul>
          </div>
        )}
      </div>

      {ehPro && resumo && !podeComprar && resumo.estado === "ativo" && (
        <p className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-lg text-emerald-900">
          O teu plano PRO está ativo até {dia(resumo.fimCobertura)}. Podes renovar nos últimos 5 dias.
        </p>
      )}

      {podeComprar && pro && pro.ativo && !op.disponivel && (
        <p className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-base text-amber-900">
          Os pagamentos ainda não estão ativos. Assim que estiverem, podes comprar o PRO aqui.
        </p>
      )}
      {podeComprar && pro && pro.ativo && op.disponivel && <FormPagamento nome={pro.nome} preco={pro.preco} dias={pro.dias} pedidoAtual={pedido} />}

      {!sessao && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/cadastro/profissional" className="rounded-xl bg-primaria px-6 py-3 text-base font-bold text-white hover:opacity-90">Criar conta grátis</Link>
          <Link href="/entrar?next=/planos" className="rounded-xl border-2 border-primaria px-6 py-3 text-base font-bold text-primaria">Já tenho conta</Link>
        </div>
      )}
      {sessao?.role === "cliente" && <p className="mt-8 text-base text-slate-700">Os planos são para profissionais. Como cliente, usas o ServiLink de graça.</p>}
    </section>
  );
}
