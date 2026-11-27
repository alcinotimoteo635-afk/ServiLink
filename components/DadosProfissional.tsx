"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { FormPerfil } from "@/components/FormPerfil";
import type { Grupo } from "@/lib/categorias";

export type Dados = {
  grupo: Grupo; nome: string; foto: string | null; categoria: string; categoriaNome: string; descricao: string;
  preco: number | null; whatsapp: string; cidade: string; bairro: string; bairros: string[]; portfolio: string[];
};

// Modo leitura por defeito. O formulario so abre em "Editar Dados". Guardar fecha e volta aos dados atualizados.
export default function DadosProfissional({ d }: { d: Dados }) {
  const [editar, setEditar] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const aoGuardar = useCallback(() => { setEditar(false); setGuardado(true); setTimeout(() => setGuardado(false), 6000); }, []);
  const linha = "flex flex-col gap-0.5 border-b border-slate-100 py-2 sm:flex-row sm:gap-4";
  const rotulo = "w-44 shrink-0 text-base font-bold text-escuro";

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-escuro">Dados do profissional</h2>
        {!editar && (
          <button type="button" onClick={() => setEditar(true)} className="inline-flex items-center gap-2 rounded-xl bg-primaria px-5 py-2.5 text-base font-bold text-white hover:opacity-90">
            <Pencil className="h-5 w-5" aria-hidden="true" /> Editar Dados
          </button>
        )}
      </div>
      {guardado && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-base font-medium text-emerald-800">Dados guardados com sucesso.</p>}

      {editar ? (
        <div className="mt-4">
          <FormPerfil grupo={d.grupo} categoria={d.categoria} bairro={d.bairro} descricao={d.descricao} cidade={d.cidade} bairros={d.bairros} precoBase={d.preco} aoGuardar={aoGuardar} aoCancelar={() => setEditar(false)} />
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {d.foto ? <Image src={d.foto} alt={`Foto de ${d.nome}`} fill sizes="80px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-3xl font-bold text-slate-300" aria-hidden="true">{d.nome.charAt(0)}</span>}
            </div>
            <p className="text-lg font-bold text-escuro">{d.nome}</p>
          </div>
          <div className={linha}><span className={rotulo}>Categoria</span><span className="text-base">{d.categoriaNome}</span></div>
          <div className={linha}><span className={rotulo}>Descrição</span><span className="text-base">{d.descricao || "-"}</span></div>
          <div className={linha}><span className={rotulo}>Preço base</span><span className="text-base">{d.preco === null ? "-" : `${d.preco.toLocaleString("pt-MZ")} MT`}</span></div>
          <div className={linha}><span className={rotulo}>WhatsApp</span><span className="text-base">{d.whatsapp}</span></div>
          <div className={linha}><span className={rotulo}>Cidade</span><span className="text-base">{d.cidade || "-"}</span></div>
          <div className={linha}><span className={rotulo}>Bairro onde moras</span><span className="text-base">{d.bairro || "-"}</span></div>
          <div className={linha}><span className={rotulo}>Bairros de atendimento</span><span className="text-base">{d.bairros.length ? d.bairros.join(", ") : "-"}</span></div>
          <div className="py-2">
            <span className={rotulo}>Portfólio</span>
            {d.portfolio.length ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {d.portfolio.map((u) => <div key={u} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100"><Image src={u} alt="Trabalho" fill sizes="33vw" className="object-cover" /></div>)}
              </div>
            ) : <span className="text-base">-</span>}
          </div>
          <p className="mt-2 text-base text-slate-600">Para mudar o nome ou o WhatsApp, fala com o suporte.</p>
        </div>
      )}
    </div>
  );
}
