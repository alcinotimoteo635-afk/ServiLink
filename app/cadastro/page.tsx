import Link from "next/link";
import { Briefcase, User } from "lucide-react";

export const metadata = { title: "Criar conta - ServiLink" };

const botao = "flex items-center gap-4 rounded-2xl border-2 p-6 text-left transition-shadow hover:shadow-lg";

export default function Cadastro() {
  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-[32px] font-extrabold text-escuro md:text-[40px]">Criar conta</h1>
      <p className="mt-2 text-lg text-slate-700">Quem és tu?</p>

      <div className="mt-8 space-y-4">
        <Link href="/cadastro/cliente" className={`${botao} border-primaria bg-primaria text-white`}>
          <User className="h-10 w-10 shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-xl font-extrabold">SOU CLIENTE</span>
            <span className="block text-base">Procuro um profissional</span>
          </span>
        </Link>
        <Link href="/cadastro/profissional" className={`${botao} border-escuro bg-escuro text-white`}>
          <Briefcase className="h-10 w-10 shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-xl font-extrabold">SOU PROFISSIONAL</span>
            <span className="block text-base">Plano Essencial grátis para aparecer aos clientes</span>
          </span>
        </Link>
      </div>

      <p className="mt-8 text-base text-slate-700">
        Já tens conta? <Link href="/entrar" className="font-bold text-primaria underline">Entrar</Link>
      </p>
    </section>
  );
}
