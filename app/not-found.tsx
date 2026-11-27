import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-[32px] font-extrabold text-escuro">Página não encontrada</h1>
      <p className="mt-3 text-lg text-slate-700">Esta página não existe ou foi movida.</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-primaria px-6 py-3 text-base font-bold text-white">Ir para o início</Link>
    </section>
  );
}
