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
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-[32px] font-extrabold text-escuro">Painel Admin</h1>
      <nav aria-label="Admin" className="mt-4 flex flex-wrap gap-2">
        {ABAS.map(([href, rotulo]) => (
          <Link key={href} href={href} className="rounded-xl border-2 border-primaria px-4 py-2 text-base font-bold text-primaria hover:bg-hero">{rotulo}</Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </section>
  );
}
