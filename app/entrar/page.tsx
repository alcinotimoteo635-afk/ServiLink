import Link from "next/link";
import { redirect } from "next/navigation";
import FormEntrar from "@/components/FormEntrar";
import { obterSessao } from "@/lib/sessao";
import { caminhoSeguro } from "@/lib/validar";

export const metadata = { title: "Entrar - ServiLink" };

export default async function Entrar({ searchParams }: { searchParams: { next?: string } }) {
  const s = await obterSessao();
  const proximo = caminhoSeguro(searchParams.next, "");
  if (s) redirect(proximo || s.destino);
  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-[32px] font-extrabold text-escuro">Entrar</h1>
      <p className="mt-2 text-lg text-slate-700">Usa o teu WhatsApp e a palavra-passe.</p>
      <div className="mt-8"><FormEntrar next={proximo} /></div>
      <p className="mt-6 text-base text-slate-700">Ainda não tens conta? <Link href="/cadastro" className="font-bold text-primaria underline">Criar conta</Link></p>
      <p className="mt-3 text-base text-slate-600">Esqueceste a palavra-passe? Fala com o suporte no WhatsApp +258 83 550 4135.</p>
    </section>
  );
}
