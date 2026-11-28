import Link from "next/link";
import Image from "next/image";
import { ALTIS_LINK } from "@/lib/parceiros";

// Rodape igual a imagem de referencia: topo arredondado com linha azul, logo e frase,
// "Para ti" com os links em linha, e a linha final dentro de uma caixa arredondada.
// (Sem bloco de contactos: os contactos estao na pagina /contato.)
export default function Footer() {
  return (
    <footer className="rounded-t-3xl border-t-4 border-primaria bg-gradient-to-b from-[#0A1F44] to-[#061230] text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 pb-5 pt-6 sm:px-6 sm:pt-8 md:grid-cols-2 md:gap-8 md:pb-6 md:pt-10">
        <div>
          <p className="text-3xl font-extrabold text-white sm:text-4xl">Servi<span className="text-marca">Link</span></p>
          <p className="mt-2 text-sm sm:text-base">Conecta quem precisa com quem sabe fazer. Maputo, Moçambique.</p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="text-lg font-bold text-white sm:text-xl">Para ti</h2>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm sm:text-base md:mt-3 md:flex-col md:gap-y-2">
            <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
            <li><Link href="/livro-de-reclamacoes" className="hover:text-white">Livro de Reclamações</Link></li>
          </ul>
        </nav>
      </div>

      <div className="px-4 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-2xl border-t-2 border-primaria/70 bg-white/5 px-4 py-3 text-center text-[11px] text-slate-300 sm:text-xs">
          <span>© 2026 ServiLink. Todos os direitos reservados. | Parceiro Tecnológico:</span>
          {ALTIS_LINK ? (
            <a href={ALTIS_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline">ALTIS</a>
          ) : (
            <span className="font-semibold text-white">ALTIS</span>
          )}
          <Image src="/parceiros/altis.webp" alt="Logo da ALTIS" width={40} height={40} className="h-4 w-auto rounded-sm sm:h-5" loading="lazy" />
        </div>
      </div>
    </footer>
  );
}
