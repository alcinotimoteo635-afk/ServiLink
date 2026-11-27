// Campo de formulario grande e legivel (16px, contraste alto).
export default function CampoForm({
  id, rotulo, ajuda, children,
}: { id: string; rotulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-bold text-escuro">{rotulo}</label>
      <div className="mt-1">{children}</div>
      {ajuda && <p className="mt-1 text-base text-slate-600">{ajuda}</p>}
    </div>
  );
}

export const ESTILO_CAMPO =
  "h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-base text-texto placeholder:text-slate-500 focus:border-primaria";
