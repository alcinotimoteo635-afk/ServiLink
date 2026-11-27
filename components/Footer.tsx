import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import { CONTACTOS } from "@/lib/contactos";
import { ALTIS_LINK } from "@/lib/parceiros";

// Rodape limpo: so o que NAO existe no cabecalho.
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-escuro text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-3xl font-extrabold text-white">Servi<span className="text-marca">Link</span></p>
          <p className="mt-3 text-base">Conecta quem precisa com quem sabe fazer. Maputo, Moçambique.</p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="text-xl font-bold text-white">Para ti</h2>
          <ul className="mt-3 space-y-2 text-base">
            <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
            <li><Link href="/livro-de-reclamacoes" className="hover:text-white">Livro de Reclamações</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xl font-bold text-white">Fala connosco</h2>
          <ul className="mt-3 space-y-2 text-base">
            <li className="flex items-center gap-2"><Mail className="h-5 w-5" aria-hidden="true" />Email: <a href={`mailto:${CONTACTOS.email}`} className="hover:text-white">{CONTACTOS.email}</a></li>
            <li className="flex items-center gap-2"><MessageCircle className="h-5 w-5" aria-hidden="true" />WhatsApp: <a href={CONTACTOS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">Falar no WhatsApp</a></li>
            <li className="flex items-center gap-2"><Phone className="h-5 w-5" aria-hidden="true" />Telefone: <a href={CONTACTOS.telefoneLink} className="hover:text-white">{CONTACTOS.telefone}</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
        <span>© 2026 ServiLink. Todos os direitos reservados. | Parceiro Tecnológico:</span>
        {ALTIS_LINK ? (
          <a href={ALTIS_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-300 underline hover:text-white">ALTIS</a>
        ) : (
          <span className="font-semibold text-slate-300">ALTIS</span>
        )}
        <Image src="/parceiros/altis.webp" alt="Logo da ALTIS" width={40} height={40} className="h-6 w-auto rounded-sm" loading="lazy" />
      </div>
    </footer>
  );
}
