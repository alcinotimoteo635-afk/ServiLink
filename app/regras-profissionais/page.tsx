import PaginaTexto from "@/components/PaginaTexto";

export const metadata = { title: "Regras para profissionais - ServiLink" };

export default function Regras() {
  return (
    <PaginaTexto titulo="Regras para profissionais" subtitulo="Para manteres o teu perfil visível e a confiança dos clientes.">
      <ul className="list-disc space-y-3 pl-6">
        <li>Usa o teu nome real e uma foto tua, clara. Perfis falsos ou duplicados são suspensos.</li>
        <li>Indica a cidade e os bairros onde realmente atendes clientes.</li>
        <li>Não escrevas telefones, links ou contactos na descrição: os clientes falam contigo pelo botão do WhatsApp.</li>
        <li>Responde com respeito e cumpre o que combinas. O preço e o pagamento do serviço são combinados diretamente com o cliente.</li>
        <li>O selo de verificado significa que a equipa ServiLink fez as verificações definidas. Não garante a qualidade de cada trabalho.</li>
        <li>Denúncias são analisadas pela equipa. Nenhum perfil é banido automaticamente por causa de uma denúncia.</li>
        <li>A equipa pode suspender ou banir contas que desrespeitem estas regras, com registo do motivo.</li>
        <li>O plano Essencial é grátis. O plano PRO é opcional e dá mais visibilidade.</li>
      </ul>
    </PaginaTexto>
  );
}
