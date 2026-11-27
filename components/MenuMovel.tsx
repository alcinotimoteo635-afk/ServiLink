"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

// Menu do telemovel: fecha ao escolher um link, ao clicar fora, com Esc, ao mudar de rota
// e ao clicar outra vez no botao.
export default function MenuMovel({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const caminho = usePathname();

  useEffect(() => { setAberto(false); }, [caminho]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: Event) => { if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative lg:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-movel"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-300 text-texto"
      >
        {aberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {aberto && (
        <div
          id="menu-movel"
          onClick={(e) => { if ((e.target as HTMLElement).closest("a, button[type=submit]")) setAberto(false); }}
          className="absolute right-0 top-14 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}
