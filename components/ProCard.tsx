import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Star } from "lucide-react";
import type { ProCard as Dados } from "@/lib/profissionais";
import { categoriaPorSlug } from "@/lib/categorias";
import BotaoWhatsapp from "@/components/BotaoWhatsapp";

export function Estrelas({ nota, total }: { nota: number; total: number }) {
  if (total === 0) return <span className="text-base text-slate-600">Novo no ServiLink</span>;
  return (
    <span className="inline-flex items-center gap-1 text-base text-texto">
      <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
      <strong>{Number(nota).toFixed(1)}</strong>
      <span className="text-slate-600">({total})</span>
    </span>
  );
}

export function SelosPro({ p }: { p: Pick<Dados, "plano_ativo" | "verificado"> }) {
  return (
    <>
      {p.plano_ativo === "pro" && (
        <span className="rounded-full bg-[#FFB800] px-3 py-1 text-sm font-bold text-escuro">PRO</span>
      )}
    </>
  );
}

export default function ProCardView({ p, bloqueado = false }: { p: Dados; bloqueado?: boolean }) {
  const cat = categoriaPorSlug(p.categoria)?.nome ?? p.categoria;
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ${
        p.plano_ativo === "pro" ? "border-2 border-[#FFB800]" : "border border-slate-200"
      }`}
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {p.foto_url ? (
          <Image src={p.foto_url} alt={`Foto de ${p.nome}`} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 45vw, 90vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-bold text-slate-300" aria-hidden="true">
            {p.nome.charAt(0)}
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <SelosPro p={p} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="flex items-center gap-1 text-lg font-bold text-texto">
          {p.nome}
          {p.verificado && <BadgeCheck className="h-5 w-5 shrink-0 text-marca" aria-label="Verificado" />}
        </h3>
        <p className="text-base font-medium text-primaria">{cat}</p>
        <Estrelas nota={p.nota_media} total={p.total_avaliacoes} />
        {p.bairro && (
          <p className="flex items-center gap-1 text-base text-slate-700">
            <MapPin className="h-4 w-4" aria-hidden="true" /> {p.bairro}
          </p>
        )}
        <div className="mt-auto grid gap-2 pt-3">
          <BotaoWhatsapp id={p.id} bloqueado={bloqueado} />
          <Link
            href={`/profissional/${p.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-primaria px-4 py-3 text-base font-bold text-primaria hover:bg-hero"
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  );
}
