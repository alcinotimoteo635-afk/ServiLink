"use server";

import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { chaveIp, minutosBloqueado, registarFalha, verificarCaptcha } from "@/lib/seguranca";
import { limparTexto } from "@/lib/validar";

export type Estado = { ok?: boolean; erro?: string } | null;

export async function enviarReclamacao(_a: Estado, form: FormData): Promise<Estado> {
  const admin = criarClienteAdmin();
  const chave = chaveIp("recl");
  const bloqueio = await minutosBloqueado(admin, chave);
  if (bloqueio) return { erro: `Muitas tentativas. Tenta de novo em ${bloqueio} minutos.` };
  await registarFalha(admin, chave, 5);
  if (!(await verificarCaptcha(form))) return { erro: "Confirma que não és um robô e tenta de novo." };

  const texto = limparTexto(form.get("texto"), 1000);
  if (texto.length < 10) return { erro: "Descreve a reclamação (mínimo 10 caracteres)." };
  const nome = limparTexto(form.get("nome"), 80);
  const contacto = limparTexto(form.get("contacto"), 80);
  const sessao = await obterSessao();

  const { error } = await admin.from("reclamacoes").insert({
    autor_id: sessao?.id ?? null, nome_interno: nome || null, contacto_interno: contacto || null, texto,
  });
  if (error) return { erro: "Não foi possível enviar. Tenta de novo." };
  return { ok: true };
}
