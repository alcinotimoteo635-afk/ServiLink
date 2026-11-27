import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";

// Paginas do admin: quem nao e admin e mandado embora (verificado no servidor).
export async function exigirAdminPagina(): Promise<string> {
  const s = await obterSessao();
  if (!s) redirect("/entrar");
  if (s.role !== "admin") redirect("/");
  return s.id;
}

// Server actions do admin: lanca erro se nao for admin.
export async function exigirAdminAcao(): Promise<string> {
  const s = await obterSessao();
  if (!s || s.role !== "admin") throw new Error("Sem permissao");
  return s.id;
}
