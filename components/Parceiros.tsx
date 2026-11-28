import Image from "next/image";
import { PARCEIROS, ESPACOS_RESERVADOS } from "@/lib/parceiros";

// Parceiros: titulo com barra azul, e cartoes pequenos (logo em cima, nome por baixo)
// em 2 colunas no telemovel e 4 no PC. Para juntar outro parceiro: lib/parceiros.ts.
export default function Parceiros() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12" aria-labelledby="titulo-parceiros">
      <h2 id="titulo-parceiros" className="text-center text-2xl font-extrabold text-escuro sm:text-3xl">Parceiros</h2>
      <div className="mx-auto mt-2 h-1 w-14 rounded-full bg-primaria" aria-hidden="true" />

      {PARCEIROS.length > 0 ? (
        <ul className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {PARCEIROS.map((p) => {
            const conteudo = (
              <>
                <div className={`relative h-20 w-full overflow-hidden rounded-xl sm:h-24 ${p.fundoEscuro ? "bg-black" : "bg-slate-100"}`}>
                  <Image src={p.logo} alt={`Logo de ${p.nome}`} fill sizes="(min-width:768px) 20vw, 45vw" className="object-contain p-1.5" loading="lazy" />
                </div>
                <p className="mt-2 text-center text-sm font-bold leading-snug text-escuro sm:text-base">{p.nome}</p>
              </>
            );
            return (
              <li key={p.nome}>
                <div className="h-full rounded-2xl bg-white p-2.5 shadow-md ring-1 ring-slate-100">
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noopener noreferrer nofollow" className="block">{conteudo}</a>
                  ) : (
                    conteudo
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {Array.from({ length: ESPACOS_RESERVADOS }, (_, i) => (
            <li key={i}>
              <div className="flex h-24 w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white">
                <span className="text-sm text-slate-500">Logo do parceiro</span>
              </div>
              <p className="mt-2 text-center text-sm font-bold text-slate-500">Nome do parceiro</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
