import Link from "next/link";
import { Search } from "lucide-react";
import { categoriasDoGrupo, GRUPOS } from "@/lib/categorias";
import { grupoAtual } from "@/lib/grupo";
import { bairrosSugeridos, listarProfissionais } from "@/lib/profissionais";
import ProCardView from "@/components/ProCard";
import { CIDADES, todosOsBairros } from "@/lib/localidades";
import { registarEvento } from "@/lib/eventos";
import { obterSessao } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { contactadosDe } from "@/lib/whatsapp-limite";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profissionais - ServiLink" };

const POR_PAGINA = 12;
const campo = "h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-base text-texto";

export default async function Profissionais({
  searchParams,
}: {
  searchParams: { g?: string; categoria?: string; q?: string; bairro?: string; cidade?: string; p?: string };
}) {
  const grupo = grupoAtual(searchParams.g);
  const categorias = categoriasDoGrupo(grupo);
  const cat = categorias.find((c) => c.slug === searchParams.categoria) ?? null;
  const q = (searchParams.q ?? "").slice(0, 60);
  const bairro = (searchParams.bairro ?? "").slice(0, 60);
  const cidade = CIDADES.includes(searchParams.cidade ?? "") ? (searchParams.cidade as string) : "";
  const pagina = Math.max(1, Number(searchParams.p) || 1);

  const sessao = await obterSessao();
  const contactados = await contactadosDe(criarClienteAdmin(), sessao);
  const [{ itens, total }, bairros] = await Promise.all([
    listarProfissionais({ grupo, categoria: cat?.slug, q, bairro, cidade, pagina, porPagina: POR_PAGINA }),
    bairrosSugeridos(grupo),
  ]);

  if (q || cat || bairro || cidade) await registarEvento("pesquisa", { categoria: cat?.slug ?? null, cidade: cidade || null, bairro: bairro || null });
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const link = (p: number) => {
    const s = new URLSearchParams({ g: grupo });
    if (cat) s.set("categoria", cat.slug);
    if (q) s.set("q", q);
    if (bairro) s.set("bairro", bairro);
    if (cidade) s.set("cidade", cidade);
    if (p > 1) s.set("p", String(p));
    return `/profissionais?${s.toString()}`;
  };
  const outro = grupo === "digital" ? "domicilio" : "digital";

  const titulo = cat ? `${cat.nome}${bairro ? ` em ${bairro}` : ""}` : `Profissionais: ${GRUPOS[grupo].nome}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-[32px] font-extrabold leading-tight text-escuro md:text-[40px]">{titulo}</h1>

      <form method="get" action="/profissionais" className="mt-6 grid gap-3 md:grid-cols-[2fr_1.3fr_1.2fr_1.5fr_auto]" role="search">
        <input type="hidden" name="g" value={grupo} />
        <div>
          <label htmlFor="q" className="sr-only">O que você precisa hoje?</label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={60} placeholder="O que você precisa hoje?" className={`${campo} placeholder:text-slate-600`} />
        </div>
        <div>
          <label htmlFor="categoria" className="sr-only">Tipo de profissional</label>
          <select id="categoria" name="categoria" defaultValue={cat?.slug ?? ""} className={campo}>
            <option value="">Todos os tipos</option>
            {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cidade" className="sr-only">Cidade</label>
          <select id="cidade" name="cidade" defaultValue={cidade} className={campo}>
            <option value="">Todas as cidades</option>
            {CIDADES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="bairro" className="sr-only">Bairro</label>
          <input id="bairro" name="bairro" list="bairros" defaultValue={bairro} maxLength={60} placeholder="Bairro (ex.: Polana)" className={`${campo} placeholder:text-slate-600`} />
          <datalist id="bairros">{Array.from(new Set([...todosOsBairros(), ...bairros])).map((b) => <option key={b} value={b} />)}</datalist>
        </div>
        <button type="submit" className="h-12 rounded-xl bg-primaria px-6 text-base font-bold text-white hover:opacity-90">
          <Search className="mr-2 inline h-5 w-5" aria-hidden="true" /> Procurar
        </button>
      </form>

      <p className="mt-4 text-base text-slate-700">
        {total === 0 ? "Nenhum profissional encontrado." : `${total} profissional${total === 1 ? "" : "is"} encontrado${total === 1 ? "" : "s"}.`}
      </p>

      {total === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-base text-slate-700">
            Ainda não encontrámos profissionais nesta zona. Experimenta outra categoria, bairro ou localização.
            {cat === null && q && <> Também podes procurar em <Link className="font-bold text-primaria underline" href={`/profissionais?g=${outro}&q=${encodeURIComponent(q)}`}>{GRUPOS[outro].nome}</Link>.</>}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {itens.map((p) => <ProCardView key={p.id} p={p} bloqueado={contactados.has(p.id)} />)}
        </div>
      )}

      {paginas > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Páginas">
          {pagina > 1 && <Link href={link(pagina - 1)} className="rounded-xl border-2 border-primaria px-5 py-3 text-base font-bold text-primaria">Anterior</Link>}
          <span className="text-base text-slate-700">Página {pagina} de {paginas}</span>
          {pagina < paginas && <Link href={link(pagina + 1)} className="rounded-xl border-2 border-primaria px-5 py-3 text-base font-bold text-primaria">Seguinte</Link>}
        </nav>
      )}
    </section>
  );
}
