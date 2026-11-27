export default function PaginaTexto({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-[32px] font-extrabold text-escuro md:text-4xl">{titulo}</h1>
      {subtitulo && <p className="mt-2 text-slate-600">{subtitulo}</p>}
      <div className="mt-8 space-y-4 text-base leading-relaxed text-texto">{children}</div>
    </section>
  );
}
