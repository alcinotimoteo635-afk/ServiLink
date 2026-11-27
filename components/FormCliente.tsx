"use client";

import { useFormState } from "react-dom";
import BotaoEnviar from "@/components/BotaoEnviar";
import Captcha from "@/components/Captcha";
import CampoForm, { ESTILO_CAMPO } from "@/components/CampoForm";
import { cadastrarCliente, type Estado } from "@/app/cadastro/actions";

export default function FormCliente() {
  const [estado, acao] = useFormState<Estado, FormData>(cadastrarCliente, null);
  return (
    <form action={acao} className="space-y-4">
      <CampoForm id="nome" rotulo="Nome">
        <input id="nome" name="nome" required maxLength={80} autoComplete="name" className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="whatsapp" rotulo="WhatsApp" ajuda="Só números moçambicanos. Não é mostrado a ninguém.">
        <input id="whatsapp" name="whatsapp" type="tel" inputMode="numeric" required autoComplete="tel" placeholder="84 123 4567" className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="bairro" rotulo="Bairro">
        <input id="bairro" name="bairro" required maxLength={80} placeholder="Ex.: Matola, Liberdade" className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="senha" rotulo="Palavra-passe" ajuda="Mínimo 8 caracteres.">
        <input id="senha" name="senha" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={ESTILO_CAMPO} />
      </CampoForm>
      <Captcha />
      {estado?.erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-700">{estado.erro}</p>}
      <BotaoEnviar rotulo="Criar conta e procurar" carregando="A criar..." className="w-full" />
    </form>
  );
}
