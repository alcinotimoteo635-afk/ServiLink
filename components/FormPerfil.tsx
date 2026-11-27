"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import BotaoEnviar from "@/components/BotaoEnviar";
import CampoForm, { ESTILO_CAMPO } from "@/components/CampoForm";
import { atualizarGaleria, editarPerfil, type Estado } from "@/app/painel/actions";
import { categoriasDoGrupo, type Grupo } from "@/lib/categorias";
import SeletorLocalizacao from "@/components/SeletorLocalizacao";

export function FormPerfil({
  grupo, categoria, bairro, descricao, cidade, bairros, precoBase, aoGuardar, aoCancelar,
}: {
  grupo: Grupo; categoria: string; bairro: string; descricao: string; cidade: string; bairros: string[]; precoBase: number | null;
  aoGuardar: () => void; aoCancelar: () => void;
}) {
  const [estado, acao] = useFormState<Estado, FormData>(editarPerfil, null);
  useEffect(() => { if (estado?.ok) aoGuardar(); }, [estado, aoGuardar]);
  return (
    <form action={acao} className="space-y-4">
      <CampoForm id="categoria" rotulo="O que fazes?">
        <select id="categoria" name="categoria" defaultValue={categoria} className={ESTILO_CAMPO}>
          {categoriasDoGrupo(grupo).map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
        </select>
      </CampoForm>
      <CampoForm id="bairro" rotulo="Bairro onde moras">
        <input id="bairro" name="bairro" defaultValue={bairro} required maxLength={80} className={ESTILO_CAMPO} />
      </CampoForm>
      <SeletorLocalizacao cidade={cidade} bairros={bairros} />
      <CampoForm id="preco_base" rotulo="Preço base em MT (opcional)">
        <input id="preco_base" name="preco_base" type="number" inputMode="numeric" min={0} max={100000000} defaultValue={precoBase ?? ""} className={ESTILO_CAMPO} />
      </CampoForm>
      <CampoForm id="descricao" rotulo="Sobre o teu trabalho" ajuda="Sem telefone nem contactos: os clientes falam contigo pelo botão do WhatsApp.">
        <textarea id="descricao" name="descricao" defaultValue={descricao} rows={3} maxLength={200} className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-base text-texto" />
      </CampoForm>
      <CampoForm id="foto" rotulo="Trocar a foto de perfil (opcional)" ajuda="Se não escolheres, a foto atual fica. JPG, PNG ou WEBP, até 2 MB.">
        <input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-base file:mr-3 file:rounded-lg file:border-0 file:bg-primaria file:px-4 file:py-3 file:text-base file:font-bold file:text-white" />
      </CampoForm>
      {estado?.erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-base text-red-700">{estado.erro}</p>}
      <div className="flex flex-wrap gap-3">
        <BotaoEnviar rotulo="Guardar alterações" carregando="A guardar..." />
        <button type="button" onClick={aoCancelar} className="rounded-xl border-2 border-slate-300 px-6 py-3 text-base font-bold text-texto hover:bg-slate-50">Cancelar</button>
      </div>
    </form>
  );
}

export function FormGaleria() {
  const [estado, acao] = useFormState<Estado, FormData>(atualizarGaleria, null);
  return (
    <form action={acao} className="space-y-3">
      <CampoForm id="fotos" rotulo="Fotos de trabalhos (até 3)" ajuda="Ao enviar, substituem as fotos anteriores. Se não enviares nada, ficam as atuais.">
        <input id="fotos" name="fotos" type="file" multiple accept="image/jpeg,image/png,image/webp" className="block w-full text-base file:mr-3 file:rounded-lg file:border-0 file:bg-primaria file:px-4 file:py-3 file:text-base file:font-bold file:text-white" />
      </CampoForm>
      {estado?.ok && <p className="rounded-xl bg-emerald-50 p-3 text-base text-emerald-800">Fotos guardadas.</p>}
      {estado?.erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-base text-red-700">{estado.erro}</p>}
      <BotaoEnviar rotulo="Enviar fotos" carregando="A enviar..." />
    </form>
  );
}
