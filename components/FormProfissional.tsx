"use client";

import { useFormState } from "react-dom";
import BotaoEnviar from "@/components/BotaoEnviar";
import Captcha from "@/components/Captcha";
import CampoForm, { ESTILO_CAMPO } from "@/components/CampoForm";
import { cadastrarProfissional, type Estado } from "@/app/cadastro/actions";
import { categoriasDoGrupo, type Grupo } from "@/lib/categorias";
import SeletorLocalizacao from "@/components/SeletorLocalizacao";

export default function FormProfissional({ grupo }: { grupo: Grupo }) {
  const [estado, acao] = useFormState<Estado, FormData>(cadastrarProfissional, null);
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="grupo" value={grupo} />
      <CampoForm id="nome" rotulo="Nome">
        <input id="nome" name="nome" required maxLength={80} autoComplete="name" className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="whatsapp" rotulo="WhatsApp" ajuda="É para onde os clientes vão falar contigo. Não aparece escrito no site.">
        <input id="whatsapp" name="whatsapp" type="tel" inputMode="numeric" required autoComplete="tel" placeholder="84 123 4567" className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="bairro" rotulo="Bairro onde moras">
        <input id="bairro" name="bairro" required maxLength={80} placeholder="Ex.: Liberdade" className={ESTILO_CAMPO} />
      </CampoForm>
      <SeletorLocalizacao />
      <CampoForm id="preco_base" rotulo="Preço base em MT (opcional)">
        <input id="preco_base" name="preco_base" type="number" inputMode="numeric" min={0} max={100000000} className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="categoria" rotulo="O que fazes?">
        <select id="categoria" name="categoria" required defaultValue="" className={ESTILO_CAMPO}>
          <option value="" disabled>Escolhe</option>
          {categoriasDoGrupo(grupo).map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
        </select>
      </CampoForm>
      <CampoForm id="descricao" rotulo="Conta em 1 frase o teu trabalho (opcional)">
        <textarea id="descricao" name="descricao" rows={2} maxLength={200} className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-base text-texto" />
      </CampoForm>
      <CampoForm id="foto" rotulo="1 foto tua" ajuda="JPG, PNG ou WEBP, até 2 MB. Uma foto clara do teu rosto.">
        <input id="foto" name="foto" type="file" required accept="image/jpeg,image/png,image/webp" className="block w-full text-base file:mr-3 file:rounded-lg file:border-0 file:bg-primaria file:px-4 file:py-3 file:text-base file:font-bold file:text-white" />
      </CampoForm>
      <CampoForm id="senha" rotulo="Palavra-passe" ajuda="Mínimo 8 caracteres. Vais entrar com o WhatsApp e esta palavra-passe.">
        <input id="senha" name="senha" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={ESTILO_CAMPO} />
      </CampoForm>
      <Captcha />
      {estado?.erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-700">{estado.erro}</p>}
      <BotaoEnviar rotulo="Enviar para análise" carregando="A enviar..." className="w-full" />
    </form>
  );
}
