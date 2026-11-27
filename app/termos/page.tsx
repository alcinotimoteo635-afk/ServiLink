import PaginaTexto from "@/components/PaginaTexto";

export const metadata = { title: "Termos de uso - ServiLink" };

export default function Termos() {
  return (
    <PaginaTexto titulo="Termos de uso" subtitulo="Em linguagem simples.">
      <ul className="list-disc space-y-3 pl-6">
        <li>O ServiLink é um diretório: ajuda clientes a encontrar profissionais e a falar com eles no WhatsApp.</li>
        <li>O ServiLink não cobra comissão e não recebe pagamentos pelos trabalhos. O preço e o pagamento do serviço são combinados entre cliente e profissional.</li>
        <li>O ServiLink não é parte do acordo entre cliente e profissional e não garante a qualidade do serviço.</li>
        <li>Cada número de WhatsApp só pode ter uma conta de profissional. Contas duplicadas ou falsas podem ser suspensas.</li>
        <li>O plano Essencial é grátis: depois da aprovação o perfil fica visível. Os planos Destaque e Anual PRO são pagos e dão mais visibilidade. Se um plano pago acabar, voltas ao Essencial grátis.</li>
        <li>É proibido publicar informação falsa, ofensiva ou fotos que não sejam tuas. Avaliações devem ser honestas.</li>
        <li>A ServiLink pode aprovar, recusar, esconder ou suspender contas que não cumpram estas regras.</li>
        <li>Qualquer perfil suspeito pode ser denunciado no botão "Denunciar perfil".</li>
      </ul>
    </PaginaTexto>
  );
}
