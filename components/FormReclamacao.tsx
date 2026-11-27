"use client";

import { useFormState } from "react-dom";
import BotaoEnviar from "@/components/BotaoEnviar";
import Captcha from "@/components/Captcha";
import CampoForm, { ESTILO_CAMPO } from "@/components/CampoForm";
import { enviarReclamacao, type Estado } from "@/app/livro-de-reclamacoes/actions";

export default function FormReclamacao() {
  const [estado, acao] = useFormState<Estado, FormData>(enviarReclamacao, null);
  if (estado?.ok) return <p role="status" className="rounded-xl bg-emerald-50 p-4 text-base text-emerald-800">Reclamação recebida. A equipa ServiLink vai analisá-la.</p>;
  return (
    <form action={acao} className="space-y-4">
      <CampoForm id="texto" rotulo="O que aconteceu?">
        <textarea id="texto" name="texto" required minLength={10} maxLength={1000} rows={5} className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-base text-texto" />
      </CampoForm>
      <CampoForm id="nome" rotulo="O teu nome (opcional)" ajuda="Só a equipa ServiLink vê o teu nome. Publicamente aparece SIGILO.">
        <input id="nome" name="nome" maxLength={80} className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="contacto" rotulo="Telefone ou email para te responder (opcional)" ajuda="Só a equipa ServiLink vê este contacto.">
        <input id="contacto" name="contacto" maxLength={80} className={ESTILO_CAMPO} />
      </CampoForm>
      <Captcha />
      {estado?.erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-700">{estado.erro}</p>}
      <BotaoEnviar rotulo="Enviar reclamação" carregando="A enviar..." />
    </form>
  );
}
