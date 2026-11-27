import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, MessageCircle, Star } from "lucide-react";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { categoriaPorSlug, GRUPOS } from "@/lib/categorias";
import { UUID } from "@/lib/validar";
import { fmtData, mt } from "@/lib/datas";
import { ehPlanoPro } from "@/lib/plano";
import { registarEvento } from "@/lib/eventos";
import { contactadosDe } from "@/lib/whatsapp-limite";
import { Estrelas, SelosPro } from "@/components/ProCard";
import FormAvaliacao from "@/components/FormAvaliacao";
import FormDenuncia from "@/components/FormDenuncia";
import BotaoWhatsapp from "@/components/BotaoWhatsapp";

export const dynamic = "force-dynamic";

const AVISOS: Record<string, string> = {
  pro: "Os profissionais não contactam outros profissionais por aqui. Entra como cliente para pedir um serviço.",
  limite: "Já contactaste este profissional hoje. Só podes clicar 1 vez por dia: volta amanhã.",
  erro: "Não foi possível abrir o WhatsApp deste profissional. Tenta mais tarde.",
};

export default async function Perfil({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aviso?: string };
}) {
  if (!UUID.test(params.id)) notFound();
  const admin = criarClienteAdmin();
  const sessao = await obterSessao();

  const { data: v } = await admin
    .from("v_profissionais")
    .select("id, nome, bairro, cidade, bairros_atendimento, preco_base, grupo, categoria, descricao, foto_url, galeria, verificado, plano_ativo, nota_media, total_avaliacoes")
    .eq("id", params.id)
    .maybeSingle();

  let p = v;
  let visivel = Boolean(v);
  if (!p && sessao && (sessao.role === "admin" || sessao.id === params.id)) {
    // O dono e o admin veem o perfil mesmo quando esta escondido (pre-visualizacao).
    const { data: u } = await admin
      .from("users")
      .select("id, nome, bairro, cidade, bairros_atendimento, preco_base, grupo, categoria, descricao, foto_url, galeria, verificado, plano_codigo, pago_ate")
      .eq("id", params.id)
      .eq("role", "profissional")
      .maybeSingle();
    if (u) {
      const planoAtivo = u.pago_ate && new Date(u.pago_ate) > new Date() && ehPlanoPro(u.plano_codigo) ? "pro" : "essencial";
      p = { ...u, plano_ativo: planoAtivo, nota_media: 0, total_avaliacoes: 0 };
      visivel = false;
    }
  }
  if (!p) notFound();

  const { data: avaliacoes } = await admin
    .from("reviews")
    .select("id, nota, comentario, created_at, cliente_id")
    .eq("profissional_id", p.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const ids = Array.from(new Set((avaliacoes ?? []).map((a) => a.cliente_id)));
  const { data: nomes } = ids.length ? await admin.from("users").select("id, nome").in("id", ids) : { data: [] };
  const primeiroNome = new Map((nomes ?? []).map((n) => [n.id, String(n.nome).split(" ")[0]]));

  const jaContactouHoje = (await contactadosDe(admin, sessao)).has(p.id);
  let podeAvaliar = false;
  let jaAvaliou = false;
  if (sessao?.role === "cliente") {
    const { data: minha } = await admin.from("reviews").select("id").eq("cliente_id", sessao.id).eq("profissional_id", p.id).maybeSingle();
    jaAvaliou = Boolean(minha);
    podeAvaliar = !jaAvaliou;
  }
  if (visivel && sessao?.id !== p.id) await registarEvento("perfil", { categoria: p.categoria, cidade: p.cidade, ref: p.id });

  const cat = categoriaPorSlug(p.categoria)?.nome ?? p.categoria;
  const comGaleria = p.plano_ativo === "pro" && (p.galeria ?? []).length > 0;
  const ehDono = sessao?.id === p.id;
  const nota = Number(p.nota_media);
  const total = Number(p.total_avaliacoes);
  const aviso = searchParams.aviso ? AVISOS[searchParams.aviso] : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {!visivel && (
        <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-900">
          Pré-visualização: este perfil <strong>não está visível ao público</strong> neste momento.
        </p>
      )}
      {aviso && <p role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-900">{aviso}</p>}

      <div className="grid gap-8 md:grid-cols-[340px_1fr]">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100">
            {p.foto_url ? (
              <Image src={p.foto_url} alt={`Foto de ${p.nome}`} fill priority sizes="(min-width:768px) 340px, 100vw" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl font-bold text-slate-300" aria-hidden="true">{p.nome.charAt(0)}</div>
            )}
            <div className="absolute left-2 top-2 flex flex-wrap gap-1"><SelosPro p={p} /></div>
          </div>
        </div>

        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-[32px] font-extrabold leading-tight text-escuro md:text-[40px]">
            {p.nome}
            {p.verificado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-base font-bold text-primaria">
                <BadgeCheck className="h-5 w-5" aria-hidden="true" /> Verificado
              </span>
            )}
          </h1>
          <p className="mt-1 text-lg font-medium text-primaria">{cat} · {GRUPOS[p.grupo as "digital" | "domicilio"].nome}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Estrelas nota={nota} total={total} />
            {p.bairro && <span className="inline-flex items-center gap-1 text-base text-slate-700"><MapPin className="h-5 w-5" aria-hidden="true" /> {p.bairro}</span>}
          </div>

          {p.descricao && <p className="mt-5 whitespace-pre-wrap text-lg text-texto">{p.descricao}</p>}
          {p.preco_base !== null && p.preco_base !== undefined && <p className="mt-3 text-lg text-texto"><strong>Preço base:</strong> {mt(p.preco_base)} <span className="text-base text-slate-600">(combinas o valor final com o profissional)</span></p>}
          {p.cidade && (
            <p className="mt-3 text-base text-texto">
              <strong>Atende em {p.cidade}:</strong> {(p.bairros_atendimento ?? []).length ? (p.bairros_atendimento ?? []).join(", ") : "vários bairros"}
            </p>
          )}

          {!ehDono && sessao?.role !== "profissional" && (
            <div className="mt-6">
              <BotaoWhatsapp id={p.id} grande bloqueado={jaContactouHoje} />
              
              <p className="mt-2 text-base text-slate-600">Combinas o preço diretamente. O ServiLink não cobra comissão.</p>
            </div>
          )}
          {ehDono && (
            <p className="mt-6 rounded-xl bg-hero p-4 text-base text-slate-700">
              Este é o teu perfil como os clientes o vêem. <Link href="/painel" className="font-bold text-primaria underline">Voltar ao painel</Link>
            </p>
          )}
        </div>
      </div>

      {comGaleria && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-escuro">Trabalhos</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(p.galeria ?? []).slice(0, 3).map((url: string) => (
              <div key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                <Image src={url} alt={`Trabalho de ${p.nome}`} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-escuro">Avaliações</h2>
        {(avaliacoes ?? []).length === 0 ? (
          <p className="mt-3 text-base text-slate-700">Ainda sem avaliações.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(avaliacoes ?? []).map((a) => (
              <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-base">
                  <span className="inline-flex" aria-label={`${a.nota} de 5 estrelas`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-5 w-5 ${n <= a.nota ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden="true" />
                    ))}
                  </span>
                  <strong className="text-escuro">{primeiroNome.get(a.cliente_id) ?? "Cliente"}</strong>
                  <span className="text-slate-500">{fmtData(a.created_at).slice(0, 10)}</span>
                </p>
                {a.comentario && <p className="mt-1 text-base text-texto">{a.comentario}</p>}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          {sessao?.role === "cliente" && podeAvaliar && <FormAvaliacao proId={p.id} />}
          {sessao?.role === "cliente" && jaAvaliou && <p className="text-base text-slate-700">Já avaliaste este profissional. Obrigado!</p>}
          {sessao?.role === "cliente" && !podeAvaliar && !jaAvaliou && (
            <p className="text-base text-slate-700">Já avaliaste este profissional.</p>
          )}
          {!sessao && <p className="text-base text-slate-700"><Link href={`/entrar?next=/profissional/${p.id}`} className="font-bold text-primaria underline">Entra</Link> para avaliar este profissional.</p>}
        </div>
      </div>

      {sessao && !ehDono && sessao.role !== "admin" && (
        <div className="mt-10">
          <FormDenuncia alvoId={p.id} />
        </div>
      )}
    </section>
  );
}
