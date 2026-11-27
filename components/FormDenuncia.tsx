"use client";

import { useFormState } from "react-dom";
import { Flag } from "lucide-react";
import BotaoEnviar from "@/components/BotaoEnviar";
import { denunciar, type Resultado } from "@/app/profissional/[id]/actions";

export default function FormDenuncia({ alvoId }: { alvoId: string }) {
  const [estado, acao] = useFormState<Resultado, FormData>(denunciar, null);
  return (
    <details className="rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-base font-medium text-slate-700">
        <Flag className="h-5 w-5" aria-hidden="true" /> Denunciar perfil
      </summary>
      <form action={acao} className="space-y-3 border-t border-slate-200 p-4">
        <input type="hidden" name="alvo_id" value={alvoId} />
        <label htmlFor="tipo" className="text-base font-medium text-escuro">Motivo</label>
        <select id="tipo" name="tipo" required defaultValue="" className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-base text-texto">
          <option value="" disabled>Escolhe</option>
          <option value="perfil_falso">Perfil falso</option>
          <option value="contacto_invalido">Contacto inválido</option>
          <option value="informacao_enganosa">Informação enganosa</option>
          <option value="comportamento">Comportamento inadequado</option>
          <option value="fraude">Suspeita de fraude</option>
          <option value="outro">Outro motivo</option>
        </select>
        <label htmlFor="motivo" className="text-base font-medium text-escuro">Explica o que se passa</label>
        <textarea id="motivo" name="motivo" required minLength={5} maxLength={500} rows={3} className="w-full rounded-xl border-2 border-slate-300 p-3 text-base text-texto" />
        {estado?.ok && <p className="text-base text-emerald-700">Denúncia enviada. Obrigado, vamos analisar.</p>}
        {estado && !estado.ok && <p role="alert" className="text-base text-red-700">{estado.erro}</p>}
        <BotaoEnviar rotulo="Enviar denúncia" />
      </form>
    </details>
  );
}
