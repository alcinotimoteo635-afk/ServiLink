import PaginaTexto from "@/components/PaginaTexto";
import { CONTACTOS } from "@/lib/contactos";

export const metadata = { title: "Privacidade - ServiLink" };

export default function Privacidade() {
  return (
    <PaginaTexto titulo="Privacidade" subtitulo="Que dados guardamos e porquê.">
      <ul className="list-disc space-y-3 pl-6">
        <li>Guardamos o teu nome, bairro e número de WhatsApp para criar a tua conta. Os profissionais guardam ainda a foto e a descrição do serviço.</li>
        <li>O número de WhatsApp é guardado cifrado. O teu número só é usado para o cliente falar contigo através do botão do perfil e para a equipa ServiLink te contactar.</li>
        <li>Contamos quantos cliques o botão de WhatsApp recebe. Só a equipa ServiLink vê esses números.</li>
        <li>Usamos cookies só para manter a tua sessão e para lembrar a tua escolha (Serviços Digitais ou Técnico ao Domicílio).</li>
        <li>Nunca vendemos os teus dados.</li>
        <li>Para apagar a tua conta ou pedir os teus dados, fala connosco: {CONTACTOS.email} ou {CONTACTOS.telefone}.</li>
      </ul>
    </PaginaTexto>
  );
}
