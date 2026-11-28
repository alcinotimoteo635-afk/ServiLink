import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Star } from "lucide-react";
import type { ProCard as Dados } from "@/lib/profissionais";
import { categoriaPorSlug } from "@/lib/categorias";
import BotaoWhatsapp from "@/components/BotaoWhatsapp";

export function Estrelas({ nota, total }: { nota: number; total: number }) {
  if (total === 0) return <span className="text-xs text-slate-600 sm:text-base">Novo no ServiLink</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-texto sm:text-base">
      <Star className="h-4 w-4 fill-amber-400 sm:h-5 sm:w-5 text-amber-400" aria-hidden="true" />
      <strong>{Number(nota).toFixed(1)}</strong>
      <span className="text-slate-600">({total})</span>
    </span>
  );
}

export function SelosPro({ p }: { p: Pick<Dados, "plano_ativo" | "verificado"> }) {
  return (
    <>
      {p.plano_ativo === "pro" && (
        <span className="rounded-full bg-[#FFB800] px-2 py-0.5 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-sm text-escuro">PRO</span>
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
          <Image src={p.foto_url} alt={`Foto de ${p.nome}`} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-300 sm:text-5xl" aria-hidden="true">
            {p.nome.charAt(0)}
          </div>
        )}
        <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1 sm:left-2 sm:top-2">
          <SelosPro p={p} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5 sm:gap-2 sm:p-4">
        <h3 className="flex min-w-0 items-center gap-1 text-sm font-bold text-texto sm:text-lg">
          <span className="truncate">{p.nome}</span>
          {p.verificado && <BadgeCheck className="h-4 w-4 shrink-0 text-marca sm:h-5 sm:w-5" aria-label="Verificado" />}
        </h3>
        <p className="truncate text-xs font-medium text-primaria sm:text-base">{cat}</p>
        <Estrelas nota={p.nota_media} total={p.total_avaliacoes} />
        {p.bairro && (
          <p className="flex min-w-0 items-center gap-1 text-xs text-slate-700 sm:text-base">
            <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" /> <span className="truncate">{p.bairro}</span>
          </p>
        )}
        <div className="mt-auto grid gap-1.5 pt-2 sm:gap-2 sm:pt-3">
          <BotaoWhatsapp id={p.id} bloqueado={bloqueado} />
          <Link
            href={`/profissional/${p.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-primaria px-2 py-2 text-xs font-bold text-primaria hover:bg-hero sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  );
}
