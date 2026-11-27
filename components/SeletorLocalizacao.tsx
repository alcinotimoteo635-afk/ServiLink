"use client";

import { useState } from "react";
import CampoForm, { ESTILO_CAMPO } from "@/components/CampoForm";
import { CIDADES, LOCALIDADES } from "@/lib/localidades";

// Cidade + bairros onde presta servicos (selecao multipla; so bairros da cidade escolhida).
export default function SeletorLocalizacao({ cidade = "", bairros = [] }: { cidade?: string; bairros?: string[] }) {
  const [c, setC] = useState(cidade);
  const [sel, setSel] = useState<string[]>(bairros);
  const lista = c ? LOCALIDADES[c] ?? [] : [];
  return (
    <>
      <CampoForm id="cidade" rotulo="Cidade onde atendes">
        <select id="cidade" name="cidade" required value={c} onChange={(e) => { setC(e.target.value); setSel([]); }} className={ESTILO_CAMPO}>
          <option value="" disabled>Escolhe</option>
          {CIDADES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </CampoForm>
      {c && (
        <fieldset>
          <legend className="text-base font-bold text-escuro">Bairros onde atendes clientes</legend>
          <p className="text-base text-slate-600">Escolhe um ou mais. Podes adicionar ou tirar quando quiseres.</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {lista.map((b) => {
              const on = sel.includes(b);
              return (
                <label key={b} className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-base ${on ? "border-primaria bg-hero font-bold" : "border-slate-300"}`}>
                  <input type="checkbox" name="bairros" value={b} checked={on} onChange={() => setSel(on ? sel.filter((x) => x !== b) : [...sel, b])} className="h-4 w-4" />
                  {b}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );
}
