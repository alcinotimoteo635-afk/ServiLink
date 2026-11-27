"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { categoriasDoGrupo } from "@/lib/categorias";
import { guardarFoto } from "@/lib/fotos";
import { validarTextoSeguro } from "@/lib/anti-vazamento";
import { calcularPlano, ehPlanoPro } from "@/lib/plano";
import { UUID, lerImagem, limparTexto } from "@/lib/validar";
import { validarLocalizacao } from "@/lib/localidades";

export type Estado = { ok?: boolean; erro?: string } | null;

async function profissionalAprovado() {
  const s = await obterSessao();
  return s && s.role === "profissional" && s.status === "aprovado" ? s : null;
}

// O profissional so pode fechar avisos VERDES. O vermelho so o admin retira.
export async function fecharAviso(form: FormData) {
  const s = await profissionalAprovado();
  const id = String(form.get("id") ?? "");
  if (!s || !UUID.test(id)) return;
  await criarClienteAdmin()
    .from("avisos")
    .update({ ativo: false })
    .eq("id", id)
    .eq("user_id", s.id)
    .eq("cor", "verde");
  revalidatePath("/painel", "layout");
}

export async function editarPerfil(_a: Estado, form: FormData): Promise<Estado> {
  const s = await profissionalAprovado();
  if (!s || !s.grupo) return { erro: "Sessão expirada. Entra de novo." };

  const bairro = limparTexto(form.get("bairro"), 80);
  const descricao = limparTexto(form.get("descricao"), 200);
  const categoria = categoriasDoGrupo(s.grupo).find((c) => c.slug === String(form.get("categoria") ?? ""));
  if (bairro.length < 2) return { erro: "Indica o teu bairro." };
  if (!categoria) return { erro: "Escolhe o que fazes." };
  if (descricao && !validarTextoSeguro(descricao).ok) return { erro: "Não coloques contactos na descrição." };

  const loc = validarLocalizacao(form.get("cidade"), form.getAll("bairros"));
  if (!loc.ok) return { erro: loc.erro };
  const precoBruto = String(form.get("preco_base") ?? "").trim();
  const precoBase = precoBruto === "" ? null : Math.floor(Number(precoBruto));
  if (precoBase !== null && (!Number.isFinite(precoBase) || precoBase < 0 || precoBase > 100000000)) return { erro: "Preço base inválido." };

  const admin = criarClienteAdmin();
  const campos: Record<string, unknown> = { bairro, descricao: descricao || null, categoria: categoria.slug, cidade: loc.cidade, bairros_atendimento: loc.bairros, preco_base: precoBase };

  const f = form.get("foto");
  if (f instanceof File && f.size > 0) {
    const img = await lerImagem(f);
    if (!img.ok) return { erro: img.erro };
    const url = await guardarFoto(admin, "perfis", s.id, img);
    if (!url) return { erro: "Não foi possível guardar a foto." };
    campos.foto_url = url;
  }

  // So atualiza o proprio perfil (id vem da sessao no servidor, nunca do formulario).
  const { error } = await admin.from("users").update(campos).eq("id", s.id).eq("role", "profissional");
  if (error) return { erro: "Não foi possível guardar. Os teus dados continuam no formulário: tenta de novo." };
  revalidatePath("/painel", "layout");
  return { ok: true };
}

// Galeria de 3 fotos: so no plano PRO (verificado no servidor).
export async function atualizarGaleria(_a: Estado, form: FormData): Promise<Estado> {
  const s = await profissionalAprovado();
  if (!s) return { erro: "Sessão expirada. Entra de novo." };

  const admin = criarClienteAdmin();
  const { data: u } = await admin.from("users").select("status, trial_fim, pago_ate, plano_codigo, oculto_manual").eq("id", s.id).single();
  const r = u ? calcularPlano(u) : null;
  const permitido = r?.estado === "ativo" && (ehPlanoPro(u?.plano_codigo));
  if (!permitido) return { erro: "As fotos de trabalhos estão nos planos Destaque e Anual PRO." };

  const ficheiros = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
  if (ficheiros.length === 0) return { erro: "Escolhe até 3 fotos." };

  const urls: string[] = [];
  for (const f of ficheiros) {
    const img = await lerImagem(f);
    if (!img.ok) return { erro: img.erro };
    const url = await guardarFoto(admin, "galeria", s.id, img);
    if (!url) return { erro: "Não foi possível guardar as fotos." };
    urls.push(url);
  }
  await admin.from("users").update({ galeria: urls }).eq("id", s.id);
  revalidatePath("/painel", "layout");
  return { ok: true };
}
