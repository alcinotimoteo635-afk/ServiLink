import Link from "next/link";
import { categoriasDoGrupo, GRUPOS, type Grupo } from "@/lib/categorias";
import { grupoAtual } from "@/lib/grupo";
import { contagemPorCategoria } from "@/lib/profissionais";
import IconeCategoria from "@/components/IconeCategoria";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categorias - ServiLink" };

export default async function Categorias({ searchParams }: { searchParams: { g?: string } }) {
  const atual = grupoAtual(searchParams.g);
  const ordem: Grupo[] = atual === "digital" ? ["digital", "domicilio"] : ["domicilio", "digital"];
  const contagem = await contagemPorCategoria();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-[32px] font-extrabold text-escuro md:text-[48px]">Categorias</h1>
      <p className="mt-2 text-lg text-slate-700">Escolhe a área e fala direto com o profissional no WhatsApp.</p>

      {ordem.map((g) => (
        <div key={g} className="mt-10">
          <h2 className="text-2xl font-bold text-escuro">{GRUPOS[g].nome}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {categoriasDoGrupo(g).map((c) => {
              const n = contagem.get(c.slug) ?? 0;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/profissionais?g=${g}&categoria=${c.slug}`}
                    className="flex h-full flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 hover:border-primaria hover:shadow-md"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-hero text-primaria">
                      <IconeCategoria slug={c.slug} />
                    </span>
                    <span className="text-base font-bold text-escuro">{c.nome}</span>
                    <span className="text-base text-slate-600">{n === 0 ? "Em breve" : `${n} profissional${n === 1 ? "" : "is"}`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
