"use client";

import { useFormState } from "react-dom";
import { gerarSenha, type EstadoSenha } from "@/app/admin/actions";

export default function AdminSenha({ id }: { id: string }) {
  const [e, acao] = useFormState<EstadoSenha, FormData>(gerarSenha, null);
  return (
    <form action={acao} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button className="rounded-lg border-2 border-slate-400 px-3 py-1.5 text-sm font-bold text-escuro">Senha temporária</button>
      {e?.senha && <code className="rounded bg-amber-100 px-2 py-1 text-base font-bold select-all">{e.senha}</code>}
      {e?.erro && <span className="text-sm text-red-700">{e.erro}</span>}
    </form>
  );
}
