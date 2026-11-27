"use client";

import { useFormState } from "react-dom";
import BotaoEnviar from "@/components/BotaoEnviar";
import Captcha from "@/components/Captcha";
import CampoForm, { ESTILO_CAMPO } from "@/components/CampoForm";
import { entrar, type Estado } from "@/app/entrar/actions";

export default function FormEntrar({ next = "" }: { next?: string }) {
  const [estado, acao] = useFormState<Estado, FormData>(entrar, null);
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <CampoForm id="whatsapp" rotulo="Número / Código Admin">
        <input id="whatsapp" name="whatsapp" type="text" required autoComplete="username" autoCapitalize="none" placeholder="84 123 4567" className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="senha" rotulo="Palavra-passe">
        <input id="senha" name="senha" type="password" required maxLength={72} autoComplete="current-password" className={ESTILO_CAMPO} />
      </CampoForm>
      <Captcha />
      {estado?.erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-700">{estado.erro}</p>}
      <BotaoEnviar rotulo="Entrar" carregando="A entrar..." className="w-full" />
    </form>
  );
}
