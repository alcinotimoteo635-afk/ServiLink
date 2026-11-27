"use client";

import { Fragment } from "react";
import { useFormState } from "react-dom";
import { Star } from "lucide-react";
import BotaoEnviar from "@/components/BotaoEnviar";
import { avaliar, type Resultado } from "@/app/profissional/[id]/actions";

export default function FormAvaliacao({ proId }: { proId: string }) {
  const [estado, acao] = useFormState<Resultado, FormData>(avaliar, null);

  if (estado?.ok) {
    return <p className="rounded-xl bg-emerald-50 p-4 text-base text-emerald-800">Obrigado pela tua avaliação!</p>;
  }

  return (
    <form action={acao} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="pro_id" value={proId} />
      <fieldset>
        <legend className="text-base font-bold text-escuro">Como foi o serviço?</legend>
        <div className="estrelas mt-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <Fragment key={n}>
              <input type="radio" id={`nota${n}`} name="nota" value={n} required />
              <label htmlFor={`nota${n}`} title={`${n} ${n === 1 ? "estrela" : "estrelas"}`}>
                <Star className="h-9 w-9 fill-current" aria-hidden="true" />
                <span className="sr-only">{n} {n === 1 ? "estrela" : "estrelas"}</span>
              </label>
            </Fragment>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="comentario" className="text-base font-medium text-escuro">Comentário curto (opcional)</label>
        <textarea id="comentario" name="comentario" rows={3} maxLength={200} className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-base text-texto" />
      </div>
      {estado && !estado.ok && <p role="alert" className="text-base text-red-700">{estado.erro}</p>}
      <BotaoEnviar rotulo="Enviar avaliação" />
    </form>
  );
}
