import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MessageCircle, Search, UserCheck } from "lucide-react";
import { categoriasDoGrupo, GRUPOS } from "@/lib/categorias";
import { grupoAtual } from "@/lib/grupo";
import { destaquesDoMes, listarProfissionais } from "@/lib/profissionais";
import ProCardView from "@/components/ProCard";
import Parceiros from "@/components/Parceiros";
import { registarEvento } from "@/lib/eventos";
import { obterSessao } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { contactadosDe } from "@/lib/whatsapp-limite";

export const dynamic = "force-dynamic";

const SUBTITULO = {
  digital: "Designers, programadores, editores de vídeo e muito mais. Fala direto com eles no WhatsApp.",
  domicilio: "Electricista, canalizador, pintor e outros técnicos que vão até à tua casa. Fala direto no WhatsApp.",
} as const;

export default async function Inicio({ searchParams }: { searchParams: { g?: string } }) {
  const grupo = grupoAtual(searchParams.g);
  const categorias = categoriasDoGrupo(grupo);

  const sessao = await obterSessao();
  const contactados = await contactadosDe(criarClienteAdmin(), sessao);
  await registarEvento("visita", { ref: "inicio" });

  const [{ itens: recomendados }, doMes] = await Promise.all([
    listarProfissionais({ grupo, limite: 6 }),
    destaquesDoMes(grupo),
  ]);

  return (
    <>
      {/* Imagem principal: pessoas reais com a roupa ServiLink, desfocada 2-3px, com véu branco de 70% */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
          <Image
            src="/hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={60}
            className="scale-105 object-cover blur-[2px] md:blur-[3px]"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-white/70" aria-hidden="true" />

        <div className="mx-auto max-w-4xl px-4 py-12 text-center md:py-24">
          <h1 className="text-[32px] font-extrabold leading-tight text-escuro md:text-[48px]">
            Encontre o profissional ideal
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg font-medium text-escuro">{SUBTITULO[grupo]}</p>

          <form action="/profissionais" method="get" className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" role="search">
            <input type="hidden" name="g" value={grupo} />
            <label htmlFor="q" className="sr-only">O que você precisa hoje?</label>
            <input
              id="q"
              name="q"
              type="search"
              maxLength={60}
              placeholder="O que você precisa hoje?"
              className="h-14 flex-1 rounded-xl border-2 border-escuro/30 bg-white px-4 text-base text-texto placeholder:text-slate-600 focus:border-primaria"
              autoComplete="off"
            />
            <button type="submit" className="h-14 rounded-xl bg-primaria px-6 text-base font-bold text-white hover:opacity-90">
              <Search className="mr-2 inline h-5 w-5" aria-hidden="true" />
              Encontrar profissional
            </button>
          </form>

          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {categorias.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/profissionais?g=${grupo}&categoria=${c.slug}`}
                  className="inline-block rounded-full border border-escuro/30 bg-white px-4 py-2 text-base font-medium text-escuro hover:border-primaria"
                >
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CATEGORIAS DUPLICADAS ESCONDIDAS: as categorias ficam so por baixo da barra de pesquisa (ver acima). Para reativar, remover as marcas de comentario.
      <section className="mx-auto max-w-7xl px-4 py-12" aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="text-2xl font-bold text-escuro md:text-3xl">
          Categorias de {GRUPOS[grupo].nome}
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categorias.map((c) => {
            const n = contagem.get(c.slug) ?? 0;
            return (
              <li key={c.slug}>
                <Link
                  href={`/profissionais?g=${grupo}&categoria=${c.slug}`}
                  className="flex h-full flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 hover:border-primaria hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-hero text-primaria">
                    <IconeCategoria slug={c.slug} />
                  </span>
                  <span className="text-base font-bold text-escuro">{c.nome}</span>
                  <span className="text-base text-slate-600">{n === 0 ? "Em breve" : `${n} profissional${n === 1 ? "" : "is"}`}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      */}

      {doMes.length > 0 && (
        <section className="bg-amber-50 py-12" aria-labelledby="titulo-mes">
          <div className="mx-auto max-w-7xl px-4">
            <h2 id="titulo-mes" className="text-2xl font-bold text-escuro md:text-3xl">Em destaque este mês</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {doMes.map((p) => <ProCardView key={p.id} p={p} bloqueado={contactados.has(p.id)} />)}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12" aria-labelledby="titulo-recomendados">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="titulo-recomendados" className="text-2xl font-bold text-escuro md:text-3xl">Profissionais recomendados</h2>
          <Link href={`/profissionais?g=${grupo}`} className="text-base font-bold text-primaria underline">Ver todos</Link>
        </div>
        {recomendados.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-base text-slate-700">
            Ainda não há profissionais nesta área. Estamos a aprovar os primeiros.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recomendados.map((p) => <ProCardView key={p.id} p={p} bloqueado={contactados.has(p.id)} />)}
          </div>
        )}
      </section>

      <section className="bg-hero py-12">
        <div className="mx-auto max-w-7xl px-4">
          {/* 'COMO FUNCIONA' ESCONDIDO DA PAGINA INICIAL: so existe no menu (/como-funciona). Codigo guardado abaixo.
          <h2 id="titulo-como" className="text-2xl font-bold text-escuro md:text-3xl">Como funciona</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { i: Search, t: "1. Escolhe", d: "Procura pela categoria ou pelo bairro e vê os perfis e as avaliações." },
              { i: BadgeCheck, t: "2. Confia", d: "Todos os profissionais são aprovados pela equipa ServiLink, que lhes liga antes." },
              { i: MessageCircle, t: "3. Fala no WhatsApp", d: "Combinas o preço e o serviço diretamente. Sem comissão e sem pagar no site." },
            ].map(({ i: Icone, t, d }) => (
              <li key={t} className="rounded-2xl bg-white p-5 shadow-sm">
                <Icone className="h-8 w-8 text-primaria" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold text-escuro">{t}</h3>
                <p className="mt-1 text-base text-slate-700">{d}</p>
              </li>
            ))}
          </ol>

          */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-escuro p-6 text-white md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-xl font-bold"><UserCheck className="h-6 w-6" aria-hidden="true" /> És profissional?</p>
              <p className="mt-1 text-base text-slate-200">Cria a tua conta grátis e fica visível aos clientes, sem pagar nada.</p>
            </div>
            <Link href="/cadastro/profissional" className="rounded-xl bg-white px-6 py-3 text-base font-bold text-escuro hover:opacity-90">
              Quero aparecer no ServiLink
            </Link>
          </div>
        </div>
      </section>
      <Parceiros />
    </>
  );
}
