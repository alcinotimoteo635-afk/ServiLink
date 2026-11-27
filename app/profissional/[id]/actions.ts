"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { validarTextoSeguro } from "@/lib/anti-vazamento";
import { temPalavrao } from "@/lib/palavroes";
import { UUID, limparTexto } from "@/lib/validar";

export type Resultado = { ok: boolean; erro?: string } | null;

// Avaliacao: so clientes autenticados, 1 por profissional. (Um clique no WhatsApp nao prova contratacao, por isso nao e exigido.)
export async function avaliar(_a: Resultado, form: FormData): Promise<Resultado> {
  const sessao = await obterSessao();
  if (!sessao || sessao.role !== "cliente") return { ok: false, erro: "Entre como cliente para avaliar." };

  const proId = String(form.get("pro_id") ?? "");
  const nota = Math.round(Number(form.get("nota")));
  const comentario = limparTexto(form.get("comentario"), 200);
  if (!UUID.test(proId)) return { ok: false, erro: "Profissional inválido." };
  if (!(nota >= 1 && nota <= 5)) return { ok: false, erro: "Escolha de 1 a 5 estrelas." };
  if (comentario) {
    if (temPalavrao(comentario)) return { ok: false, erro: "Evite palavrões no comentário." };
    const v = validarTextoSeguro(comentario);
    if (!v.ok) return { ok: false, erro: "Não coloque contactos no comentário." };
  }

  const admin = criarClienteAdmin();
  // O perfil tem de existir e estar aprovado.
  const { data: alvo } = await admin.from("users").select("id").eq("id", proId).eq("role", "profissional").eq("status", "aprovado").maybeSingle();
  if (!alvo) return { ok: false, erro: "Este perfil não existe." };

  const { error } = await admin.from("reviews").insert({
    profissional_id: proId,
    cliente_id: sessao.id,
    nota,
    comentario: comentario || null,
  });
  if (error) return { ok: false, erro: error.code === "23505" ? "Já avaliou este profissional." : "Não foi possível guardar a avaliação." };

  revalidatePath(`/profissional/${proId}`);
  return { ok: true };
}

export async function denunciar(_a: Resultado, form: FormData): Promise<Resultado> {
  const sessao = await obterSessao();
  if (!sessao) return { ok: false, erro: "Entre na sua conta para denunciar." };

  const alvo = String(form.get("alvo_id") ?? "");
  const tipo = String(form.get("tipo") ?? "");
  if (!["perfil_falso", "contacto_invalido", "informacao_enganosa", "comportamento", "fraude", "outro"].includes(tipo)) return { ok: false, erro: "Escolhe o motivo." };
  const motivo = limparTexto(form.get("motivo"), 500);
  if (!UUID.test(alvo) || alvo === sessao.id) return { ok: false, erro: "Perfil inválido." };
  if (motivo.length < 5) return { ok: false, erro: "Explique o motivo (mínimo 5 caracteres)." };

  const admin = criarClienteAdmin();
  const hoje = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("denuncias")
    .select("id", { count: "exact", head: true })
    .eq("autor_id", sessao.id)
    .gt("created_at", hoje);
  if ((count ?? 0) >= 5) return { ok: false, erro: "Atingiu o limite de denúncias por hoje." };

  const { error } = await admin.from("denuncias").insert({ autor_id: sessao.id, alvo_id: alvo, motivo, tipo });
  if (error) return { ok: false, erro: "Não foi possível enviar a denúncia." };
  return { ok: true };
}
