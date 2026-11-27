import { PLANOS_VISIVEIS } from "@/lib/config";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Info, X } from "lucide-react";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { reconciliarPendentes } from "@/lib/pagamento-plano";
import { avisosAutomaticos, calcularPlano, ehPlanoPro } from "@/lib/plano";
import { decifrar } from "@/lib/cripto";
import { categoriaPorSlug } from "@/lib/categorias";
import DadosProfissional from "@/components/DadosProfissional";
import { GRUPOS, type Grupo } from "@/lib/categorias";
import { fmtData, mt } from "@/lib/datas";
import { fecharAviso } from "@/app/painel/actions";
import { FormGaleria } from "@/components/FormPerfil";

const dia = (d: Date | null) => (d ? fmtData(d.toISOString()).slice(0, 10) : "-");
const ESTADO_PAG: Record<string, string> = { confirmado: "Pago", falhou: "Não confirmado", pendente: "Em curso", indeterminado: "A confirmar" };

export default async function PainelProfissional({ userId, grupo, pago = false }: { userId: string; grupo: Grupo; pago?: boolean }) {
  const admin = criarClienteAdmin();
  // Confirma pagamentos que ficaram em curso (ex.: ligacao caiu a meio).
  await reconciliarPendentes(admin, userId);

  const { data: u } = await admin
    .from("users")
    .select("nome, bairro, cidade, bairros_atendimento, preco_base, galeria, whatsapp_enc, categoria, descricao, foto_url, verificado, status, trial_fim, pago_ate, plano_codigo, oculto_manual")
    .eq("id", userId)
    .single();
  if (!u) return null;

  const [{ data: avisos }, { data: pagamentos }] = await Promise.all([
    admin.from("avisos").select("id, cor, texto, created_at").eq("user_id", userId).eq("ativo", true).order("created_at", { ascending: false }),
    admin.from("pagamentos_plano").select("id, plano_codigo, valor, metodo, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
  ]);

  const r = calcularPlano(u);
  const auto = avisosAutomaticos(r);
  const planoNome = ehPlanoPro(u.plano_codigo) ? "PRO" : "Essencial";
  let tel = "";
  try { tel = u.whatsapp_enc ? `+258 ${decifrar(u.whatsapp_enc)}` : ""; } catch { tel = ""; }
  const galeriaPermitida = r.estado === "ativo" && ehPlanoPro(u.plano_codigo);

  const vermelhosAdmin = (avisos ?? []).filter((a) => a.cor === "vermelho");
  const verdes = (avisos ?? []).filter((a) => a.cor === "verde");
  const caixa = "rounded-2xl border p-4 text-base";

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-[28px] font-extrabold text-escuro md:text-[36px]">
        Olá, {u.nome.split(" ")[0]}
      </h1>
      <p className="text-base text-slate-600">Painel · {GRUPOS[grupo].profissional}</p>

      {pago && (
        <p role="status" className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-100 p-4 text-base font-medium text-emerald-900">
          Pagamento confirmado. Obrigado!
        </p>
      )}

      {/* Avisos: vermelho fixo (so o admin retira), verde (fechavel), amarelo (automatico) */}
      <div className="mt-5 space-y-3" aria-live="polite">
        {vermelhosAdmin.map((a) => (
          <div key={a.id} role="alert" className={`${caixa} flex items-start gap-3 border-red-300 bg-red-100 text-red-900`}>
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <p className="font-medium">{a.texto}</p>
          </div>
        ))}
        {auto.map((a, i) => (
          <div
            key={i}
            role={a.cor === "vermelho" ? "alert" : undefined}
            className={`${caixa} flex flex-wrap items-center gap-3 ${a.cor === "vermelho" ? "border-red-300 bg-red-100 text-red-900" : "border-amber-300 bg-amber-100 text-amber-900"}`}
          >
            {a.cor === "vermelho" ? <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" /> : <Info className="h-6 w-6 shrink-0" aria-hidden="true" />}
            <p className="min-w-0 flex-1 font-medium">{a.texto}</p>
            {a.botao && <Link href={a.botao.href} className="rounded-xl bg-primaria px-5 py-3 text-base font-bold text-white">{a.botao.rotulo}</Link>}
          </div>
        ))}
        {verdes.map((a) => (
          <div key={a.id} className={`${caixa} flex items-start gap-3 border-emerald-300 bg-emerald-100 text-emerald-900`}>
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <p className="flex-1 font-medium">{a.texto}</p>
            <form action={fecharAviso}>
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" aria-label="Fechar aviso" className="rounded-lg p-1 hover:bg-emerald-200"><X className="h-6 w-6" /></button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-escuro">O teu plano</h2>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-bold ${r.visivel ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
            {r.visivel ? <Eye className="h-5 w-5" aria-hidden="true" /> : <EyeOff className="h-5 w-5" aria-hidden="true" />}
            {r.visivel ? "Visível para os clientes" : "Escondido dos clientes"}
          </span>
        </div>

        <p className="mt-3 text-lg text-texto">
          {r.estado === "gratis" && <>Plano <strong>Essencial</strong> (grátis). O teu perfil está visível.</>}
          {r.estado === "pago_antecipado" && <>Plano {planoNome} já pago. <strong>Começa dia {dia(r.inicioPlanoPago)}</strong> e vai até {dia(r.fimCobertura)}.</>}
          {r.estado === "ativo" && <>Plano <strong>{planoNome}</strong> ativo até {dia(r.fimCobertura)} ({r.diasRestantes} {r.diasRestantes === 1 ? "dia" : "dias"}).</>}
          
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {PLANOS_VISIVEIS && r.podePagar && (
            <Link href="/planos" className="rounded-xl bg-primaria px-6 py-3 text-base font-bold text-white hover:opacity-90">
              {r.estado === "ativo" ? "Renovar plano" : "Ver planos"}
            </Link>
          )}
          <Link href={`/profissional/${userId}`} className="rounded-xl border-2 border-primaria px-6 py-3 text-base font-bold text-primaria hover:bg-hero">
            Ver o meu perfil como o cliente vê
          </Link>
        </div>
      </div>

      <DadosProfissional d={{
        grupo, nome: u.nome, foto: u.foto_url, categoria: u.categoria, categoriaNome: categoriaPorSlug(u.categoria)?.nome ?? u.categoria,
        descricao: u.descricao ?? "", preco: u.preco_base ?? null, whatsapp: tel, cidade: u.cidade ?? "", bairro: u.bairro ?? "",
        bairros: u.bairros_atendimento ?? [], portfolio: (u.galeria ?? []).slice(0, 3),
      }} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-escuro">Fotos dos teus trabalhos</h2>
        {galeriaPermitida ? (
          <div className="mt-4"><FormGaleria /></div>
        ) : (
          <p className="mt-2 text-base text-slate-700">
            Disponível no plano <strong>PRO</strong> (3 fotos no teu perfil). {PLANOS_VISIVEIS && <Link href="/planos" className="font-bold text-primaria underline">Ver planos</Link>}
          </p>
        )}
      </div>

      {(pagamentos ?? []).length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-escuro">Pagamentos</h2>
          <ul className="mt-3 space-y-2">
            {(pagamentos ?? []).map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 text-base">
                <span className="text-texto">PRO · {mt(p.valor)} · M-Pesa</span>
                <span className="text-slate-600">{fmtData(p.created_at).slice(0, 10)} · {ESTADO_PAG[p.status] ?? p.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
