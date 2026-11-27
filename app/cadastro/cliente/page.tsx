import Link from "next/link";
import { redirect } from "next/navigation";
import FormCliente from "@/components/FormCliente";
import { obterSessao } from "@/lib/sessao";

export const metadata = { title: "Sou cliente - ServiLink" };

export default async function CadastroCliente() {
  const s = await obterSessao();
  if (s) redirect(s.destino);
  return (
    <section className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-[32px] font-extrabold text-escuro">Sou cliente</h1>
      <p className="mt-2 text-lg text-slate-700">Só precisamos de 3 dados para começares a procurar.</p>
      <div className="mt-8"><FormCliente /></div>
      <p className="mt-6 text-base text-slate-700">Já tens conta? <Link href="/entrar" className="font-bold text-primaria underline">Entrar</Link></p>
    </section>
  );
}
