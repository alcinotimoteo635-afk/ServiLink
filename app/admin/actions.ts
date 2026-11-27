"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { exigirAdminAcao } from "@/lib/admin";
import { senhaTemporaria } from "@/lib/contas";
import { limparTexto, UUID } from "@/lib/validar";
import { ehPlanoPro } from "@/lib/plano";

const id = (f: FormData, k = "id") => {
  const v = String(f.get(k) ?? "");
  if (!UUID.test(v)) throw new Error("Id invalido");
  return v;
};
async function auditar(admin: ReturnType<typeof criarClienteAdmin>, adminId: string, acao: string, alvoId: string | null, motivo?: string | null) {
  let nome: string | null = null;
  if (alvoId) {
    const { data } = await admin.from("users").select("nome").eq("id", alvoId).maybeSingle();
    nome = data?.nome ?? null;
  }
  await admin.from("auditoria_admin").insert({ admin_id: adminId, acao, alvo_id: alvoId, alvo_nome: nome, motivo: motivo ? motivo.slice(0, 300) : null });
}
async function notificar(admin: ReturnType<typeof criarClienteAdmin>, userId: string, cor: "verde" | "vermelho", texto: string) {
  // Evita duplicados: nao repete o mesmo aviso ativo.
  const { data } = await admin.from("avisos").select("id").eq("user_id", userId).eq("ativo", true).eq("texto", texto).maybeSingle();
  if (!data) await admin.from("avisos").insert({ user_id: userId, cor, texto });
}
const refrescar = () => ["/admin", "/admin/pendentes", "/admin/profissionais", "/admin/clientes", "/admin/denuncias", "/profissionais", "/"].forEach((p) => revalidatePath(p));

export async function aprovar(f: FormData) {
  const adminId = await exigirAdminAcao();
  const admin = criarClienteAdmin();
  const uid = id(f);
  const { data: u } = await admin.from("users").select("role, status").eq("id", uid).single();
  if (!u || u.role !== "profissional" || u.status !== "pendente") return;
  // Plano Essencial gratis: fica visivel logo apos a aprovacao, sem data de fim.
  await admin.from("users").update({
    status: "aprovado", verificado: true, aprovado_em: new Date().toISOString(),
    trial_fim: null, motivo_rejeicao: null,
  }).eq("id", uid);
  await auditar(admin, adminId, "aprovar_profissional", uid);
  await notificar(admin, uid, "verde", "O teu cadastro foi aprovado. O teu perfil já está visível aos clientes.");
  refrescar();
}

export async function recusar(f: FormData) {
  const adminId = await exigirAdminAcao();
  const motivo = limparTexto(String(f.get("motivo") ?? ""), 200) || "Perfil não aprovado.";
  const admin = criarClienteAdmin();
  const uid = id(f);
  const { data: u } = await admin.from("users").select("role").eq("id", uid).single();
  if (!u || u.role !== "profissional") return;
  await admin.from("users").update({ status: "rejeitado", motivo_rejeicao: motivo }).eq("id", uid);
  await auditar(admin, adminId, "rejeitar_profissional", uid, motivo);
  refrescar();
}

// Suspender / banir / reativar. Nunca contas admin. O motivo fica no registo de auditoria.
export async function mudarEstado(f: FormData) {
  const adminId = await exigirAdminAcao();
  const novo = String(f.get("estado") ?? "");
  if (!["suspenso", "banido", "aprovado"].includes(novo)) return;
  const motivo = limparTexto(String(f.get("motivo") ?? ""), 200);
  if (novo !== "aprovado" && motivo.length < 3) return; // exige motivo
  const admin = criarClienteAdmin();
  const uid = id(f);
  const { data: u } = await admin.from("users").select("role, status").eq("id", uid).single();
  if (!u || u.role === "admin" || u.status === novo) return;
  if (novo === "aprovado" && !["suspenso", "banido"].includes(u.status)) return; // reativar so quem foi suspenso/banido
  await admin.from("users").update({ status: novo, motivo_rejeicao: novo === "aprovado" ? null : motivo }).eq("id", uid);
  await auditar(admin, adminId, novo === "aprovado" ? "reativar_conta" : novo === "suspenso" ? "suspender_conta" : "banir_conta", uid, motivo);
  if (novo === "suspenso") await notificar(admin, uid, "vermelho", "O teu perfil foi suspenso. Fala com o suporte do ServiLink.");
  if (novo === "aprovado") await notificar(admin, uid, "verde", "A tua conta foi reativada.");
  refrescar();
}

export async function alternarEscondido(f: FormData) {
  const adminId = await exigirAdminAcao();
  const admin = criarClienteAdmin();
  const uid = id(f);
  const { data: u } = await admin.from("users").select("oculto_manual").eq("id", uid).single();
  if (u) {
    await admin.from("users").update({ oculto_manual: !u.oculto_manual }).eq("id", uid);
    await auditar(admin, adminId, u.oculto_manual ? "mostrar_perfil" : "esconder_perfil", uid);
  }
  refrescar();
}

export async function alternarVerificado(f: FormData) {
  const adminId = await exigirAdminAcao();
  const admin = criarClienteAdmin();
  const uid = id(f);
  const { data: u } = await admin.from("users").select("verificado").eq("id", uid).single();
  if (u) {
    await admin.from("users").update({ verificado: !u.verificado }).eq("id", uid);
    await auditar(admin, adminId, u.verificado ? "tirar_selo" : "dar_selo", uid);
  }
  refrescar();
}

export async function enviarAviso(f: FormData) {
  const adminId = await exigirAdminAcao();
  const cor = f.get("cor") === "verde" ? "verde" : "vermelho";
  const texto = limparTexto(String(f.get("texto") ?? ""), 500);
  if (texto.length < 3) return; // nao envia mensagens vazias
  const admin = criarClienteAdmin();
  const uid = id(f, "user_id");
  const { data: dest } = await admin.from("users").select("id").eq("id", uid).maybeSingle();
  if (!dest) return; // destinatario tem de existir
  await admin.from("avisos").insert({ user_id: uid, cor, texto });
  await auditar(admin, adminId, "enviar_aviso", uid, texto);
  refrescar();
}

export async function removerAviso(f: FormData) {
  await exigirAdminAcao();
  await criarClienteAdmin().from("avisos").update({ ativo: false }).eq("id", id(f));
  refrescar();
}

export async function destacarNaInicial(f: FormData) {
  await exigirAdminAcao();
  const admin = criarClienteAdmin();
  const uid = id(f);
  const { data: u } = await admin.from("users").select("plano_codigo, pago_ate").eq("id", uid).single();
  if (!u || !ehPlanoPro(u.plano_codigo) || !u.pago_ate || new Date(u.pago_ate).getTime() < Date.now()) return;
  const mz = new Date(Date.now() + 2 * 3600 * 1000);
  const mes = `${mz.getUTCFullYear()}-${String(mz.getUTCMonth() + 1).padStart(2, "0")}`;
  await admin.from("users").update({ home_destaque_mes: mes }).eq("id", uid);
  refrescar();
}

export async function apagarConta(f: FormData) {
  const adminId = await exigirAdminAcao();
  if (f.get("confirmo") !== "on") return;
  const uid = id(f);
  const admin = criarClienteAdmin();
  const { data: u } = await admin.from("users").select("role").eq("id", uid).single();
  if (!u || u.role === "admin") return; // nunca apagar admin
  await auditar(admin, adminId, "apagar_conta", uid);
  await admin.auth.admin.deleteUser(uid); // historico por numero fica em contas_historico
  refrescar();
}

export type EstadoSenha = { senha?: string; erro?: string } | null;
export async function gerarSenha(_a: EstadoSenha, f: FormData): Promise<EstadoSenha> {
  await exigirAdminAcao();
  const uid = id(f);
  const admin = criarClienteAdmin();
  const { data: u } = await admin.from("users").select("role").eq("id", uid).single();
  if (!u || u.role === "admin") return { erro: "Não permitido." };
  const senha = senhaTemporaria();
  const { error } = await admin.auth.admin.updateUserById(uid, { password: senha });
  if (error) return { erro: "Não foi possível gerar a senha." };
  return { senha };
}

export async function resolverDenuncia(f: FormData) {
  await exigirAdminAcao();
  const estado = f.get("estado") === "arquivada" ? "arquivada" : "resolvida";
  await criarClienteAdmin().from("denuncias").update({ status: estado }).eq("id", id(f));
  refrescar();
}

// Preco do PRO: editavel pelo admin, sem mexer no codigo. A duracao (90 dias) fica fixa.
export async function atualizarPlanoPro(f: FormData) {
  const adminId = await exigirAdminAcao();
  const preco = Math.floor(Number(f.get("preco")));
  if (!Number.isFinite(preco) || preco < 1 || preco > 1_000_000) return;
  const ativo = f.get("ativo") === "on";
  const admin = criarClienteAdmin();
  await admin.from("planos").update({ preco, ativo, atualizado_em: new Date().toISOString() }).eq("codigo", "pro");
  await auditar(admin, adminId, "alterar_plano_pro", null, `preco=${preco} MT; ativo=${ativo}`);
  revalidatePath("/admin/planos"); revalidatePath("/planos");
}

export async function removerAvaliacao(f: FormData) {
  const adminId = await exigirAdminAcao();
  const admin = criarClienteAdmin();
  const rid = id(f);
  const { data: r } = await admin.from("reviews").select("profissional_id").eq("id", rid).maybeSingle();
  if (!r) return;
  await admin.from("reviews").delete().eq("id", rid);
  await auditar(admin, adminId, "remover_avaliacao", r.profissional_id, limparTexto(String(f.get("motivo") ?? ""), 200) || null);
  revalidatePath("/admin/avaliacoes"); revalidatePath("/profissionais");
}

export async function atualizarReclamacao(f: FormData) {
  const adminId = await exigirAdminAcao();
  const estado = String(f.get("estado") ?? "");
  if (!["nova", "em_analise", "resolvida", "arquivada"].includes(estado)) return;
  const admin = criarClienteAdmin();
  await admin.from("reclamacoes").update({ status: estado, publica: f.get("publica") === "on", resposta: limparTexto(String(f.get("resposta") ?? ""), 500) || null }).eq("id", id(f));
  await auditar(admin, adminId, "atualizar_reclamacao", null, estado);
  revalidatePath("/admin/reclamacoes"); revalidatePath("/livro-de-reclamacoes");
}
