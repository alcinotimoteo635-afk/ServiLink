import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CONTACTOS } from "@/lib/contactos";
import { LISTA_REDES, propsLinkExterno } from "@/components/IconesSociais";

export const metadata = { title: "Contato - ServiLink" };

const cartao = "flex h-full flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const bolinha = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero text-primaria";

export default function Contato() {
  return (
    <section className="mx-auto max-w-[900px] px-4 py-8 sm:py-10">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-escuro sm:text-4xl">Contato</h1>
        <p className="mt-2 text-sm text-slate-700 sm:text-base">Fala com a equipa ServiLink. Respondemos em menos de 24h.</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={cartao}>
          <div className="flex items-center gap-3">
            <span className={bolinha}><Mail className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="text-base font-bold text-escuro">Email</h2>
          </div>
          <a href={`mailto:${CONTACTOS.email}`} className="mt-2 break-all text-base font-medium text-primaria underline">{CONTACTOS.email}</a>
        </div>

        <div className={cartao}>
          <div className="flex items-center gap-3">
            <span className={bolinha}><MessageCircle className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="text-base font-bold text-escuro">WhatsApp</h2>
          </div>
          <p className="mt-2 text-base font-medium text-texto">{CONTACTOS.telefone}</p>
          <a
            href={CONTACTOS.whatsappDireto}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-whats px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Falar no WhatsApp
          </a>
        </div>

        <div className={cartao}>
          <div className="flex items-center gap-3">
            <span className={bolinha}><Phone className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="text-base font-bold text-escuro">Telefone</h2>
          </div>
          <a href={CONTACTOS.telefoneLink} className="mt-2 text-base font-medium text-primaria underline">{CONTACTOS.telefone}</a>
        </div>

        <div className={cartao}>
          <div className="flex items-center gap-3">
            <span className={bolinha}><MapPin className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="text-base font-bold text-escuro">Localização</h2>
          </div>
          <p className="mt-2 text-base font-medium text-texto">{CONTACTOS.localizacao}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <h2 className="text-base font-bold text-escuro sm:text-lg">Segue-nos</h2>
        <ul className="mx-auto mt-3 grid max-w-md grid-cols-3 gap-2">
          {LISTA_REDES.map(({ nome, href, Icone }) => (
            <li key={nome}>
              {/* TODO: colocar link real em lib/contactos.ts (REDES). Com "#" o botao nao abre nada. */}
              <a
                href={href}
                {...propsLinkExterno(href)}
                aria-label={nome}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-primaria px-2 py-2.5 text-xs font-bold text-primaria hover:bg-hero sm:flex-row sm:gap-2 sm:text-sm"
              >
                <Icone className="h-5 w-5" />
                {nome}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
