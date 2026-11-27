import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import MenuMovel from "@/components/MenuMovel";
import Logo from "@/components/Logo";
import BarraGrupo from "@/components/BarraGrupo";
import { obterSessao } from "@/lib/sessao";
import { grupoAtual } from "@/lib/grupo";
import NavLinks from "@/components/NavLinks";
import { PLANOS_VISIVEIS } from "@/lib/config";
import { sair } from "@/app/sair/actions";

const TODOS = [
  { href: "/", rotulo: "Início" },
  { href: "/categorias", rotulo: "Categorias" },
  { href: "/como-funciona", rotulo: "Como Funciona" },
  { href: "/profissionais", rotulo: "Profissionais" },
  { href: "/planos", rotulo: "Planos" },
  { href: "/contato", rotulo: "Contato" },
];
// PLANOS ESCONDIDOS PARA LANÇAMENTO - REATIVAR DEPOIS (lib/config.ts)
const LINKS = TODOS.filter((l) => PLANOS_VISIVEIS || l.href !== "/planos");

export default async function Header() {
  const sessao = await obterSessao();
  const inicial = grupoAtual();
  // Tipo de conta vem do role real da sessao (servidor), nunca do navegador.
  const rotuloConta = sessao ? (sessao.role === "admin" ? "Conta Admin" : sessao.role === "profissional" ? "Conta Profissional" : "Conta Cliente") : "";
  const botao = "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-base font-bold";

  const conta = sessao ? (
    <>
      {sessao.role !== "cliente" ? (
        <Link href={sessao.destino} className={`${botao} border-2 border-primaria text-primaria hover:bg-hero`} aria-label={`Meu painel, ${rotuloConta}`}>
          <span className="flex flex-col items-center leading-tight"><span>Meu painel</span><span className="text-xs font-semibold text-slate-600">{rotuloConta}</span></span>
        </Link>
      ) : (
        <span className="rounded-xl bg-hero px-4 py-2 text-base font-bold text-primaria">{rotuloConta}</span>
      )}
      <span className="max-w-[10rem] truncate text-base font-medium text-texto" title={sessao.nome}>
        {sessao.nome.split(" ")[0]}
      </span>
      <form action={sair}>
        <button type="submit" className={`${botao} border-2 border-slate-300 text-texto hover:bg-slate-50`}>
          <LogOut className="mr-2 h-5 w-5" aria-hidden="true" /> Sair
        </button>
      </form>
    </>
  ) : (
    <>
      <Link href="/entrar" className={`${botao} border-2 border-primaria text-primaria hover:bg-hero`}>Entrar</Link>
      <Link href="/cadastro" className={`${botao} bg-primaria text-white hover:opacity-90`}>Criar conta grátis</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5">
        <Logo altura={56} prioridade />

        <nav className="hidden items-center gap-2 lg:flex" aria-label="Principal">
          <NavLinks links={LINKS} />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">{conta}</div>

        {/* Telemovel: fecha sozinho (ver MenuMovel) */}
        <MenuMovel>
          <nav className="flex flex-col" aria-label="Menu">
            <NavLinks links={LINKS} movel />
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">{conta}</div>
        </MenuMovel>
      </div>

      <Suspense fallback={null}>
        <BarraGrupo inicial={inicial} />
      </Suspense>
    </header>
  );
}
