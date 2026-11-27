import crypto from "crypto";
import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hashHmac } from "@/lib/cripto";

export function ipDoPedido(): string {
  const h = headers();
  const xff = h.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? h.get("x-real-ip") ?? "desconhecido").trim().slice(0, 64);
}

// Identificador anonimo do aparelho (cookie HttpOnly criado no middleware). Serve so para
// o admin ver "possivel conta duplicada"; guardamos apenas o hash.
export function dispositivoAtual(): string | null {
  const v = cookies().get("sl_dev")?.value;
  return v && /^[a-f0-9]{32}$/.test(v) ? hashHmac("dev", v) : null;
}

// ---- Limite de tentativas: 5 erradas = bloqueio de 15 minutos --------------------------
const JANELA_MS = 15 * 60 * 1000;

export async function minutosBloqueado(admin: SupabaseClient, chave: string): Promise<number> {
  const { data } = await admin.from("login_tentativas").select("bloqueado_ate").eq("chave", chave).maybeSingle();
  if (data?.bloqueado_ate) {
    const resta = new Date(data.bloqueado_ate).getTime() - Date.now();
    if (resta > 0) return Math.ceil(resta / 60000);
  }
  return 0;
}

export async function registarFalha(admin: SupabaseClient, chave: string, max = 5): Promise<void> {
  const { data } = await admin.from("login_tentativas").select("tentativas, atualizado_em").eq("chave", chave).maybeSingle();
  const dentroDaJanela = data && Date.now() - new Date(data.atualizado_em).getTime() < JANELA_MS;
  const tentativas = (dentroDaJanela ? data.tentativas : 0) + 1;
  await admin.from("login_tentativas").upsert({
    chave,
    tentativas: tentativas >= max ? 0 : tentativas,
    bloqueado_ate: tentativas >= max ? new Date(Date.now() + JANELA_MS).toISOString() : null,
    atualizado_em: new Date().toISOString(),
  });
}

export async function limparFalhas(admin: SupabaseClient, chave: string): Promise<void> {
  await admin.from("login_tentativas").delete().eq("chave", chave);
}

export const chaveIp = (prefixo: string) => `${prefixo}:ip:${crypto.createHash("sha256").update(ipDoPedido()).digest("hex").slice(0, 24)}`;

// ---- CAPTCHA (Cloudflare Turnstile) -------------------------------------------------------
export function captchaConfigurado(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verificarCaptcha(form: FormData): Promise<boolean> {
  const segredo = process.env.TURNSTILE_SECRET_KEY;
  if (!segredo) {
    // Sem chaves (ex.: desenvolvimento) nao bloqueia, mas o painel do admin mostra aviso.
    return true;
  }
  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!token) return false;
  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: segredo, response: token, remoteip: ipDoPedido() }),
      cache: "no-store",
    });
    const j = await resp.json();
    return j.success === true;
  } catch {
    return false;
  }
}
