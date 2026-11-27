import Link from "next/link";
import { redirect } from "next/navigation";
import { Laptop, Home } from "lucide-react";
import FormProfissional from "@/components/FormProfissional";
import { GRUPOS, grupoValido } from "@/lib/categorias";
import { obterSessao } from "@/lib/sessao";

export const metadata = { title: "Sou profissional - ServiLink" };

export default async function CadastroProfissional({ searchParams }: { searchParams: { g?: string } }) {
  const s = await obterSessao();
  if (s) redirect(s.destino);
  const grupo = grupoValido(searchParams.g);

  if (!grupo) {
    return (
      <section className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-[32px] font-extrabold text-escuro">Sou profissional</h1>
        <p className="mt-2 text-lg text-slate-700">Que tipo de técnico és?</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/cadastro/profissional?g=digital" className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primaria p-6 text-center hover:bg-hero">
            <Laptop className="h-12 w-12 text-primaria" aria-hidden="true" />
            <span className="text-xl font-extrabold text-escuro">TÉCNICO DIGITAL</span>
            <span className="text-base text-slate-700">Design, vídeo, sites, redes sociais...</span>
          </Link>
          <Link href="/cadastro/profissional?g=domicilio" className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primaria p-6 text-center hover:bg-hero">
            <Home className="h-12 w-12 text-primaria" aria-hidden="true" />
            <span className="text-xl font-extrabold text-escuro">TÉCNICO AO DOMICÍLIO</span>
            <span className="text-base text-slate-700">Electricista, canalizador, pintor...</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-[32px] font-extrabold text-escuro">Sou {GRUPOS[grupo].profissional}</h1>
      <p className="mt-2 text-base text-slate-700">
        Depois de enviares, a equipa ServiLink liga-te para confirmar. Depois de aprovado, apareces no plano Essencial grátis.{" "}
        <Link href="/cadastro/profissional" className="font-bold text-primaria underline">Mudar tipo</Link>
      </p>
      <div className="mt-8"><FormProfissional grupo={grupo} /></div>
    </section>
  );
}
