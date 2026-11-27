import PaginaTexto from "@/components/PaginaTexto";
import { CONTACTOS } from "@/lib/contactos";

export const metadata = { title: "Contato - ServiLink" };

export default function Contato() {
  return (
    <PaginaTexto titulo="Contato" subtitulo="Fala com a equipa ServiLink.">
      <ul className="space-y-3 text-lg">
        <li><strong>Email:</strong> <a className="text-primaria underline" href={`mailto:${CONTACTOS.email}`}>{CONTACTOS.email}</a></li>
        <li><strong>Contacto:</strong> <a className="text-primaria underline" href={CONTACTOS.telefoneLink}>{CONTACTOS.telefone}</a></li>
      </ul>
      <a href={CONTACTOS.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-whats px-6 py-3 text-base font-bold text-white hover:opacity-90">
        Falar no WhatsApp
      </a>
    </PaginaTexto>
  );
}
