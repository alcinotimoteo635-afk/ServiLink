import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailInterno, hashWhatsapp } from "@/lib/cripto";

export type Papel = "cliente" | "profissional";

export const identidade = (role: Papel, n9: string) => {
  const hash = hashWhatsapp(n9);
  return { hash, email: emailInterno(role, hash) };
};

// Cria a conta de autenticacao (ja confirmada). Devolve o id ou o motivo do erro.
export async function criarAuth(
  admin: SupabaseClient,
  email: string,
  password: string
): Promise<{ id: string } | { erro: "existe" | "falha" }> {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    if (error && /already|registered|exists/i.test(error.message)) return { erro: "existe" };
    console.error("[contas] createUser falhou:", error?.message);
    return { erro: "falha" };
  }
  return { id: data.user.id };
}

export function nomeNormalizado(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

export function senhaTemporaria(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => alfabeto[crypto.randomInt(alfabeto.length)]).join("");
}
