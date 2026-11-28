import Link from "next/link";
import { exigirAdminPagina } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin - ServiLink", robots: { index: false, follow: false } };

const ABAS = [
  ["/admin", "Resumo"],
  ["/admin/pendentes", "Pendentes"],
  ["/admin/profissionais", "Profissionais"],
  ["/admin/clientes", "Clientes"],
  ["/admin/pagamentos", "Pagamentos"],
  ["/admin/planos", "Plano PRO"],
  ["/admin/reclamacoes", "Reclamações"],
  ["/admin/denuncias", "Denúncias"],
  ["/admin/avaliacoes", "Avaliações"],
  ["/admin/auditoria", "Auditoria"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdminPagina();
  return (
    <section className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
      <h1 className="text-xl font-extrabold text-escuro sm:text-[32px]">Painel Admin</h1>
      <nav aria-label="Admin" className="mt-3 flex flex-wrap gap-2 sm:mt-4">
        {ABAS.map(([href, rotulo]) => (
          <Link key={href} href={href} className="rounded-lg border-2 border-primaria px-3 py-1.5 text-xs font-bold text-primaria hover:bg-hero sm:rounded-xl sm:px-4 sm:py-2 sm:text-base">{rotulo}</Link>
        ))}
      </nav>
      <div className="mt-4 sm:mt-6">{children}</div>
    </section>
  );
}
