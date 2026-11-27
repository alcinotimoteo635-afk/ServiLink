"use client";

import { useFormStatus } from "react-dom";

export default function BotaoEnviar({
  rotulo,
  carregando = "A enviar...",
  className = "",
}: {
  rotulo: string;
  carregando?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-xl bg-primaria px-6 py-3 text-base font-bold text-white hover:opacity-90 disabled:opacity-60 ${className}`}
    >
      {pending ? carregando : rotulo}
    </button>
  );
}
