import { cookies } from "next/headers";
import { grupoValido, type Grupo } from "@/lib/categorias";

// Grupo escolhido: URL (?g=) primeiro, depois a ultima escolha guardada (cookie), senao digital.
export function grupoAtual(g?: string | null): Grupo {
  return grupoValido(g) ?? grupoValido(cookies().get("sl_grupo")?.value) ?? "digital";
}
