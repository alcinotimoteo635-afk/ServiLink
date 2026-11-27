import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

// Porta unica: cada pessoa e enviada para o seu proprio painel (nao escolhe de novo).
export default async function Painel() {
  const s = await obterSessao();
  if (!s) redirect("/entrar?next=/painel");
  if (s.role === "profissional" && s.status !== "aprovado") redirect(`/em-analise?estado=${s.status}`);
  redirect(s.destino);
}
