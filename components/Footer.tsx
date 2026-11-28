import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import { CONTACTOS } from "@/lib/contactos";
import { ALTIS_LINK } from "@/lib/parceiros";

// Rodape limpo: so o que NAO existe no cabecalho.
// Mobile-first: no telemovel tudo e mais pequeno; de sm: para cima volta ao tamanho do PC.
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-escuro text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:gap-8 sm:py-10 md:grid-cols-3">
        <div>
          <p className="text-2xl font-extrabold text-white sm:text-3xl">Servi<span className="text-marca">Link</span></p>
          <p className="mt-2 text-sm sm:mt-3 sm:text-base">Conecta quem precisa com quem sabe fazer. Maputo, Moçambique.</p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="text-base font-bold text-white sm:text-xl">Para ti</h2>
          <ul className="mt-2 space-y-1.5 text-sm sm:mt-3 sm:space-y-2 sm:text-base">
            <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
            <li><Link href="/livro-de-reclamacoes" className="hover:text-white">Livro de Reclamações</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-base font-bold text-white sm:text-xl">Fala connosco</h2>
          <ul className="mt-2 space-y-1.5 text-sm sm:mt-3 sm:space-y-2 sm:text-base">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />Email: <a href={`mailto:${CONTACTOS.email}`} className="hover:text-white">{CONTACTOS.email}</a></li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />WhatsApp: <a href={CONTACTOS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">Falar no WhatsApp</a></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />Telefone: <a href={CONTACTOS.telefoneLink} className="hover:text-white">{CONTACTOS.telefone}</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-white/10 px-4 py-3 text-center text-[11px] text-slate-400 sm:py-4 sm:text-xs">
        <span>© 2026 ServiLink. Todos os direitos reservados. | Parceiro Tecnológico:</span>
        {ALTIS_LINK ? (
          <a href={ALTIS_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-300 underline hover:text-white">ALTIS</a>
        ) : (
          <span className="font-semibold text-slate-300">ALTIS</span>
        )}
        <Image src="/parceiros/altis.webp" alt="Logo da ALTIS" width={40} height={40} className="h-5 w-auto rounded-sm sm:h-6" loading="lazy" />
      </div>
    </footer>
  );
}
