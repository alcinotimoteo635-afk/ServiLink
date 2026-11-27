import Image from "next/image";
import { PARCEIROS, ESPACOS_RESERVADOS } from "@/lib/parceiros";

// Logo em cima, nome por baixo. Sem parceiros: espacos reservados.
export default function Parceiros() {
  const itens = PARCEIROS.length
    ? PARCEIROS.map((p) => ({ ...p, vazio: false }))
    : Array.from({ length: ESPACOS_RESERVADOS }, () => ({ nome: "Nome do parceiro", logo: "", link: undefined as string | undefined, fundoEscuro: false, vazio: true }));
  return (
    <section className="mx-auto max-w-7xl px-4 py-12" aria-labelledby="titulo-parceiros">
      <h2 id="titulo-parceiros" className="text-center text-2xl font-bold text-escuro md:text-3xl">Parceiros</h2>
      <ul className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        {itens.map((p, i) => {
          const conteudo = (
            <>
              <div className={`relative flex h-24 w-full items-center justify-center overflow-hidden rounded-2xl border-2 ${p.vazio ? "border-dashed border-slate-300 bg-white" : p.fundoEscuro ? "border-escuro bg-black" : "border-slate-200 bg-white"} md:h-28`}>
                {p.vazio ? (
                  <span className="text-base text-slate-500">Logo do parceiro</span>
                ) : (
                  <Image src={p.logo} alt={`Logo de ${p.nome}`} fill sizes="25vw" className="object-contain p-3" loading="lazy" />
                )}
              </div>
              <p className={`mt-3 text-center text-base font-bold ${p.vazio ? "text-slate-500" : "text-escuro"}`}>{p.nome}</p>
            </>
          );
          return (
            <li key={i}>
              {p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer nofollow" className="block">{conteudo}</a> : conteudo}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
