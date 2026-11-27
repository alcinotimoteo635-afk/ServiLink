"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type LinkMenu = { href: string; rotulo: string };

// Destaca a pagina ativa (pill azul #2563EB, texto branco, sombra e sublinhado). Hover: azul claro.
export default function NavLinks({ links, movel = false }: { links: LinkMenu[]; movel?: boolean }) {
  const caminho = usePathname() || "/";
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(href + "/") || (href === "/profissionais" && caminho.startsWith("/profissional/")));
  return (
    <>
      {links.map((l) => {
        const a = ativo(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={a ? "page" : undefined}
            className={
              a
                ? `relative rounded-full bg-[#2563EB] px-4 py-2 text-base font-bold text-white shadow-md shadow-blue-300/60 after:absolute after:inset-x-5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-white/70 ${movel ? "my-0.5" : ""}`
                : `rounded-full px-4 py-2 text-base font-medium text-texto transition-colors hover:bg-blue-100 hover:text-[#2563EB] ${movel ? "my-0.5" : ""}`
            }
          >
            {l.rotulo}
          </Link>
        );
      })}
    </>
  );
}
