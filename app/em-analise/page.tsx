import Link from "next/link";
import { Clock, XCircle } from "lucide-react";

export const metadata = { title: "A tua conta - ServiLink", robots: { index: false, follow: false } };

export default function EmAnalise({ searchParams }: { searchParams: { estado?: string; novo?: string } }) {
  const estado = searchParams.estado;
  const rejeitado = estado === "rejeitado";
  const banido = estado === "banido";
  const suspenso = estado === "suspenso";

  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      {rejeitado || banido || suspenso ? (
        <XCircle className="mx-auto h-16 w-16 text-red-600" aria-hidden="true" />
      ) : (
        <Clock className="mx-auto h-16 w-16 text-primaria" aria-hidden="true" />
      )}
      <h1 className="mt-4 text-[28px] font-extrabold text-escuro md:text-[36px]">
        {rejeitado ? "O teu pedido não foi aprovado" : banido ? "A tua conta foi banida" : suspenso ? "O teu perfil está suspenso" : "A tua conta está a ser analisada"}
      </h1>
      <p className="mt-4 text-lg text-slate-700">
        {rejeitado || banido || suspenso
          ? "Para saber mais, fala com a equipa ServiLink pelo WhatsApp +258 83 550 4135."
          : "Obrigado por te juntares ao ServiLink! A nossa equipa vai ligar-te para confirmar os teus dados. Assim que aprovarmos, o teu perfil fica visível no plano grátis e já podes entrar com o teu WhatsApp e a palavra-passe."}
      </p>
      <Link href="/" className="mt-8 inline-block rounded-xl bg-primaria px-6 py-3 text-base font-bold text-white">Voltar ao início</Link>
    </section>
  );
}
