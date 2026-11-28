import Image from "next/image";
import { PARCEIROS, ESPACOS_RESERVADOS } from "@/lib/parceiros";

// Cartao de parceiro: logo, nome, selo "Parceiro Oficial" e botao "Visitar".
// Sem parceiros na lista: mostra espacos reservados.
export default function Parceiros() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12" aria-labelledby="titulo-parceiros">
      <h2 id="titulo-parceiros" className="text-center text-xl font-bold text-escuro sm:text-2xl md:text-3xl">Parceiros</h2>

      {PARCEIROS.length > 0 ? (
        <ul className="mt-6 flex flex-wrap justify-center gap-4">
          {PARCEIROS.map((p) => (
            <li key={p.nome} className="w-full max-w-sm">
              <article className="flex h-full flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className={`relative h-20 w-40 overflow-hidden rounded-xl border ${p.fundoEscuro ? "border-escuro bg-black" : "border-slate-200 bg-white"}`}>
                  <Image src={p.logo} alt={`Logo de ${p.nome}`} fill sizes="160px" className="object-contain p-2" loading="lazy" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-escuro sm:text-lg">
                    {p.nome}{p.descricao ? <span className="font-medium text-slate-700"> - {p.descricao}</span> : null}
                  </h3>
                </div>
                {p.oficial && (
                  <span className="rounded-full bg-hero px-3 py-1 text-xs font-bold text-primaria sm:text-sm">Parceiro Oficial</span>
                )}
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-auto inline-flex items-center justify-center rounded-xl bg-primaria px-5 py-2 text-sm font-bold text-white hover:opacity-90"
                  >
                    Visitar ↗
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Link em breve"
                    className="mt-auto inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-primaria px-5 py-2 text-sm font-bold text-white opacity-40"
                  >
                    Visitar ↗
                  </span>
                )}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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
