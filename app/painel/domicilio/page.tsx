import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import PainelProfissional from "@/components/PainelProfissional";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel - ServiLink", robots: { index: false, follow: false } };

export default async function Painel_domicilio({ searchParams }: { searchParams: { pago?: string } }) {
  const s = await obterSessao();
  if (!s) redirect("/entrar?next=/painel");
  if (s.role !== "profissional" || s.status !== "aprovado" || s.grupo !== "domicilio") redirect("/painel");
  return <PainelProfissional userId={s.id} grupo="domicilio" pago={searchParams.pago === "1"} />;
}
