import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import { CONTACTOS } from "@/lib/contactos";
import { ALTIS_LINK } from "@/lib/parceiros";
import { LISTA_REDES, propsLinkExterno } from "@/components/IconesSociais";

// Rodape baseado na imagem de referencia: topo arredondado com linha azul, azul escuro,
// links "Para ti" em linha, e a linha final dentro de uma caixa arredondada.
// Mobile: tudo empilhado e compacto. Desktop (md:): 3 colunas.
// Os links das redes sociais mudam-se em lib/contactos.ts (REDES).
export default function Footer() {
  return (
    <footer className="rounded-t-3xl border-t-4 border-primaria bg-gradient-to-b from-[#0A1F44] to-[#061230] text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 pb-4 pt-6 sm:px-6 sm:pt-8 md:grid-cols-3 md:gap-8 md:pb-6 md:pt-10">
        {/* Coluna 1: marca + redes sociais */}
        <div>
          <p className="text-3xl font-extrabold text-white sm:text-4xl">Servi<span className="text-marca">Link</span></p>
          <p className="mt-2 text-sm sm:text-base">Conecta quem precisa com quem sabe fazer. Maputo, Moçambique.</p>
          <ul className="mt-3 flex gap-2">
            {LISTA_REDES.map(({ nome, href, Icone }) => (
              <li key={nome}>
                <a
                  href={href}
                  {...propsLinkExterno(href)}
                  aria-label={nome}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <Icone className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 2: links (em linha no mobile, em coluna no desktop) */}
        <nav aria-label="Rodapé">
          <h2 className="text-lg font-bold text-white sm:text-xl">Para ti</h2>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm sm:text-base md:mt-3 md:flex-col md:gap-y-2">
            <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
            <li><Link href="/livro-de-reclamacoes" className="hover:text-white">Livro de Reclamações</Link></li>
          </ul>
        </nav>

        {/* Coluna 3: contactos */}
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">Fala connosco</h2>
          <ul className="mt-2 space-y-1.5 text-sm sm:text-base md:mt-3 md:space-y-2">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />Email: <a href={`mailto:${CONTACTOS.email}`} className="hover:text-white">{CONTACTOS.email}</a></li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />WhatsApp: <a href={CONTACTOS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">Falar no WhatsApp</a></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />Telefone: <a href={CONTACTOS.telefoneLink} className="hover:text-white">{CONTACTOS.telefone}</a></li>
          </ul>
        </div>
      </div>

      {/* Linha final: caixa arredondada com linha azul no topo */}
      <div className="px-4 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border-t-2 border-primaria/70 bg-white/5 px-4 py-3 text-center text-[11px] text-slate-300 sm:text-xs">
          <span>© 2026 ServiLink. Todos os direitos reservados. | Parceiro Tecnológico:</span>
          {ALTIS_LINK ? (
            <a href={ALTIS_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline">ALTIS</a>
          ) : (
            <span className="font-semibold text-white">ALTIS</span>
          )}
          <Image src="/parceiros/altis.webp" alt="Logo da ALTIS" width={40} height={40} className="h-5 w-auto rounded-sm sm:h-6" loading="lazy" />
        </div>
      </div>
    </footer>
  );
}
