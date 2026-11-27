"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type G = "digital" | "domicilio";
const BOTOES: { g: G; rotulo: string }[] = [
  { g: "digital", rotulo: "SERVIÇOS DIGITAIS" },
  { g: "domicilio", rotulo: "TÉCNICO AO DOMICÍLIO" },
];
const ESCONDER = ["/painel", "/admin", "/entrar", "/cadastro", "/em-analise"];
// Nestas paginas troca-se de grupo ficando na mesma pagina; nas outras vai-se para a lista.
const PAGINAS_COM_GRUPO = ["/", "/categorias", "/profissionais"];

// 2 botoes sempre visiveis no topo. A troca e imediata, sem login, e a ultima escolha fica guardada.
export default function BarraGrupo({ inicial }: { inicial: G }) {
  const caminho = usePathname();
  const params = useSearchParams();
  if (ESCONDER.some((p) => caminho === p || caminho.startsWith(p + "/"))) return null;

  const da_url = params.get("g");
  const atual: G = da_url === "digital" || da_url === "domicilio" ? da_url : inicial;

  function destino(g: G): string {
    if (!PAGINAS_COM_GRUPO.includes(caminho)) return `/profissionais?g=${g}`;
    const p = new URLSearchParams(params.toString());
    p.set("g", g);
    p.delete("categoria"); // a categoria pertence a um grupo
    p.delete("p");
    return `${caminho}?${p.toString()}`;
  }

  function guardar(g: G) {
    try {
      document.cookie = `sl_grupo=${g}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // sem cookies: continua a funcionar pela URL
    }
  }

  return (
    <div className="border-t border-slate-200 bg-hero">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-2">
        {BOTOES.map((b) => {
          const ativo = atual === b.g;
          return (
            <Link
              key={b.g}
              href={destino(b.g)}
              onClick={() => guardar(b.g)}
              aria-pressed={ativo}
              className={`flex items-center justify-center rounded-xl border-2 px-2 py-2.5 text-center text-base font-bold leading-tight transition-colors ${
                ativo ? "border-primaria bg-primaria text-white" : "border-primaria bg-white text-primaria hover:bg-blue-50"
              }`}
            >
              {b.rotulo}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
