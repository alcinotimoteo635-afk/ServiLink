"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import { destinoDe } from "@/lib/sessao";
import { identidade } from "@/lib/contas";
import { chaveIp, limparFalhas, minutosBloqueado, registarFalha, verificarCaptcha } from "@/lib/seguranca";
import { caminhoSeguro, normalizarWhatsapp } from "@/lib/validar";

export type Estado = { erro?: string } | null;

const sha = (t: string) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 24);

// 5 erradas = bloqueio de 15 minutos (por conta). Limite maior por origem (redes moveis partilham IP).
async function verificarBloqueio(admin: ReturnType<typeof criarClienteAdmin>, chaves: string[]) {
  for (const c of chaves) {
    const m = await minutosBloqueado(admin, c);
    if (m) return `Muitas tentativas. Tenta de novo em ${m} minutos.`;
  }
  return null;
}

const ERRO_GERAL = "Número, código ou palavra-passe incorretos.";
const CODIGO_ADMIN = /^SL-Admin-[A-Za-z0-9]{2,20}$/i;

// Formulario unico: telefone (cliente/profissional) OU codigo Admin (SL-Admin-xxxx).
// O tipo e identificado automaticamente. O codigo Admin NUNCA e tratado como telefone e
// nunca substitui a palavra-passe. (Um email de admin tambem e aceite, para contas admin antigas.)
export async function entrar(_a: Estado, form: FormData): Promise<Estado> {
  const admin = criarClienteAdmin();
  const bruto = String(form.get("whatsapp") ?? "").trim().slice(0, 200);
  const senha = String(form.get("senha") ?? "");
  const proximo = caminhoSeguro(form.get("next"), "");

  const ehCodigoAdmin = CODIGO_ADMIN.test(bruto);
  const ehEmailAdmin = !ehCodigoAdmin && bruto.includes("@");
  const n9 = ehCodigoAdmin || ehEmailAdmin ? null : normalizarWhatsapp(bruto);

  const chaveIdent = ehCodigoAdmin || ehEmailAdmin ? `admin:${sha(bruto.toLowerCase())}` : n9 ? `login:${sha(n9)}` : `login:invalido:${chaveIp("x")}`;
  const chaveOrigem = chaveIp(ehCodigoAdmin || ehEmailAdmin ? "admin" : "login");
  const bloqueio = await verificarBloqueio(admin, [chaveIdent, chaveOrigem]);
  if (bloqueio) return { erro: bloqueio };
  if (!(await verificarCaptcha(form))) return { erro: "Confirma que não és um robô e tenta de novo." };

  const falhou = async () => {
    await registarFalha(admin, chaveIdent, 5);
    await registarFalha(admin, chaveOrigem, ehCodigoAdmin || ehEmailAdmin ? 20 : 30);
    return { erro: ERRO_GERAL };
  };
  if (!bruto || !senha || senha.length > 72) return falhou();

  const supabase = criarClienteServidor();

  // ---- Admin ----
  if (ehCodigoAdmin || ehEmailAdmin) {
    let email = ehEmailAdmin ? bruto.toLowerCase() : "";
    if (ehCodigoAdmin) {
      // Procura SO na coluna admin_code (nunca na do telefone) e exige role = admin.
      const { data: alvo } = await admin.from("users").select("id").eq("role", "admin").ilike("admin_code", bruto).maybeSingle();
      if (!alvo) return falhou();
      const { data: au } = await admin.auth.admin.getUserById(alvo.id);
      email = au?.user?.email ?? "";
    }
    if (!email) return falhou();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !data.user) return falhou();
    const { data: perfil } = await admin.from("users").select("role, status").eq("id", data.user.id).maybeSingle();
    if (perfil?.role !== "admin" || perfil.status === "banido") {
      await supabase.auth.signOut();
      return falhou();
    }
    await limparFalhas(admin, chaveIdent);
    redirect("/admin");
  }

  // ---- Cliente / Profissional ----
  if (!n9) return falhou();
  let userId: string | null = null;
  for (const papel of ["profissional", "cliente"] as const) {
    const { email } = identidade(papel, n9);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (!error && data.user) { userId = data.user.id; break; }
  }
  if (!userId) return falhou();

  await limparFalhas(admin, chaveIdent);
  const { data: perfil } = await admin.from("users").select("role, status, grupo").eq("id", userId).maybeSingle();
  if (!perfil) {
    await supabase.auth.signOut();
    return falhou();
  }
  if (perfil.status !== "aprovado") {
    await supabase.auth.signOut();
    redirect(`/em-analise?estado=${perfil.status}`);
  }
  redirect(proximo || destinoDe(perfil.role, perfil.grupo));
}
