import { cache } from "react";
import { cookies } from "next/headers";
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import type { Grupo } from "@/lib/categorias";

export type Sessao = {
  id: string;
  nome: string;
  role: "cliente" | "profissional" | "admin";
  status: string;
  grupo: Grupo | null;
  destino: string;
};

export function destinoDe(role: string, grupo: string | null): string {
  if (role === "admin") return "/admin";
  if (role === "profissional") return grupo === "domicilio" ? "/painel/domicilio" : "/painel/digital";
  return "/profissionais";
}

// Utilizador autenticado (ou null). A identidade e verificada no servidor Supabase Auth
// (getUser), nunca so pelo cookie. Visitantes sem cookie de sessao nao fazem nenhum pedido.
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  if (!supabaseConfigurado()) return null;
  if (!cookies().getAll().some((c) => c.name.startsWith("sb-"))) return null;
  try {
    const { data } = await criarClienteServidor().auth.getUser();
    if (!data.user) return null;

    const { data: perfil } = await criarClienteAdmin()
      .from("users")
      .select("nome, role, status, grupo")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!perfil || perfil.status === "banido") return null;

    return {
      id: data.user.id,
      nome: perfil.nome,
      role: perfil.role,
      status: perfil.status,
      grupo: perfil.grupo,
      destino: destinoDe(perfil.role, perfil.grupo),
    };
  } catch {
    return null;
  }
});
