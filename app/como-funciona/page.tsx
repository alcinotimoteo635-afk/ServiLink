import Link from "next/link";
import PaginaTexto from "@/components/PaginaTexto";
import { PLANOS_VISIVEIS } from "@/lib/config";

export const metadata = { title: "Como funciona - ServiLink" };

export default function ComoFunciona() {
  return (
    <PaginaTexto titulo="Como funciona" subtitulo="Simples, sem comissões e sem pagamentos pelo trabalho.">
      <h2 className="text-xl font-bold text-escuro">Para clientes</h2>
      <ol className="list-decimal space-y-2 pl-6">
        <li>Escolhe <strong>Serviços Digitais</strong> ou <strong>Técnico ao Domicílio</strong> no topo do site.</li>
        <li>Procura pela categoria ou pelo bairro e abre o perfil do profissional.</li>
        <li>Clica em <strong>Falar no WhatsApp</strong> (1 vez por dia em cada profissional) e combina tudo diretamente com ele. Não precisas de conta.</li>
        <li>Se tiveres conta de cliente, podes deixar uma avaliação de 1 a 5 estrelas.</li>
      </ol>
      <h2 className="pt-4 text-xl font-bold text-escuro">Para profissionais</h2>
      <ol className="list-decimal space-y-2 pl-6">
        <li>Cria a conta grátis. A ServiLink analisa o teu perfil.</li>
        <li>Depois de aprovado, ficas visível no <strong>plano Essencial grátis</strong>.</li>
        <li>{PLANOS_VISIVEIS ? <>Se quiseres mais destaque, podes comprar o <Link href="/planos" className="font-bold text-primaria underline">plano PRO</Link>.</> : "Mais tarde vais poder escolher o plano PRO, para teres mais destaque."}</li>
        <li>Os clientes contactam-te no WhatsApp. O ServiLink não cobra comissão. Lê as <Link href="/regras-profissionais" className="font-bold text-primaria underline">regras para profissionais</Link>.</li>
      </ol>
      <p className="rounded-xl bg-hero p-4">O pagamento do serviço é combinado entre ti e o profissional. O ServiLink não recebe nem guarda dinheiro de trabalhos.</p>
      <p className="text-sm text-slate-600">O ServiLink é uma plataforma desenvolvida em parceria com a ALTIS - Soluções Tecnológicas, empresa moçambicana focada em tecnologia.</p>
    </PaginaTexto>
  );
}
