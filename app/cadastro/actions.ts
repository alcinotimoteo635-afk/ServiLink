"use server";

import { redirect } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import { cifrar } from "@/lib/cripto";
import { criarAuth, identidade, nomeNormalizado } from "@/lib/contas";
import { categoriasDoGrupo, grupoValido } from "@/lib/categorias";
import { chaveIp, dispositivoAtual, minutosBloqueado, registarFalha, verificarCaptcha } from "@/lib/seguranca";
import { calcularPlano } from "@/lib/plano";
import { guardarFoto } from "@/lib/fotos";
import { validarTextoSeguro } from "@/lib/anti-vazamento";
import { validarLocalizacao } from "@/lib/localidades";
import { lerImagem, limparTexto, nomeValido, normalizarWhatsapp, senhaValida } from "@/lib/validar";

export type Estado = { erro?: string } | null;

async function barrar(admin: ReturnType<typeof criarClienteAdmin>, form: FormData): Promise<string | null> {
  // No maximo 15 tentativas de registo por 15 min por origem.
  const chave = chaveIp("reg");
  const bloqueio = await minutosBloqueado(admin, chave);
  if (bloqueio) return `Muitas tentativas. Tenta de novo em ${bloqueio} minutos.`;
  await registarFalha(admin, chave, 15);
  if (!(await verificarCaptcha(form))) return "Confirma que não és um robô e tenta de novo.";
  return null;
}

export async function cadastrarCliente(_a: Estado, form: FormData): Promise<Estado> {
  const admin = criarClienteAdmin();
  const barreira = await barrar(admin, form);
  if (barreira) return { erro: barreira };

  const nome = limparTexto(form.get("nome"), 80);
  const n9 = normalizarWhatsapp(String(form.get("whatsapp") ?? ""));
  const bairro = limparTexto(form.get("bairro"), 80);
  const senha = String(form.get("senha") ?? "");

  if (!nomeValido(nome)) return { erro: "Escreve o teu nome (só letras)." };
  if (!n9) return { erro: "WhatsApp inválido. Usa um número moçambicano, por exemplo 84 123 4567." };
  if (bairro.length < 2) return { erro: "Indica o teu bairro." };
  const erroSenha = senhaValida(senha);
  if (erroSenha) return { erro: erroSenha };

  const { hash, email } = identidade("cliente", n9);
  const { data: existe } = await admin.from("users").select("id").eq("role", "cliente").eq("whatsapp_hash", hash).maybeSingle();
  if (existe) return { erro: "Este WhatsApp já tem conta. Faz login." };

  const auth = await criarAuth(admin, email, senha);
  if ("erro" in auth) return { erro: auth.erro === "existe" ? "Este WhatsApp já tem conta. Faz login." : "Não foi possível criar a conta. Tenta de novo." };

  const { error } = await admin.from("users").insert({
    id: auth.id, role: "cliente", status: "aprovado", nome, bairro,
    whatsapp_enc: cifrar(n9), whatsapp_hash: hash, dispositivo_hash: dispositivoAtual(),
  });
  if (error) {
    console.error("[cadastro cliente] insert falhou:", error.message);
    await admin.auth.admin.deleteUser(auth.id);
    return { erro: "Não foi possível criar a conta. Tenta de novo." };
  }
  await admin.from("contas_historico").upsert({ whatsapp_hash: hash, role: "cliente" }, { onConflict: "whatsapp_hash,role", ignoreDuplicates: true });

  const { error: erroLogin } = await criarClienteServidor().auth.signInWithPassword({ email, password: senha });
  if (erroLogin) redirect("/entrar");
  redirect("/profissionais");
}

export async function cadastrarProfissional(_a: Estado, form: FormData): Promise<Estado> {
  const admin = criarClienteAdmin();
  const barreira = await barrar(admin, form);
  if (barreira) return { erro: barreira };

  const grupo = grupoValido(String(form.get("grupo") ?? ""));
  if (!grupo) return { erro: "Escolhe primeiro o tipo de técnico." };
  const categoria = categoriasDoGrupo(grupo).find((c) => c.slug === String(form.get("categoria") ?? ""));
  if (!categoria) return { erro: "Escolhe o que fazes." };

  const nome = limparTexto(form.get("nome"), 80);
  const n9 = normalizarWhatsapp(String(form.get("whatsapp") ?? ""));
  const bairro = limparTexto(form.get("bairro"), 80);
  const descricao = limparTexto(form.get("descricao"), 200);
  const senha = String(form.get("senha") ?? "");

  if (!nomeValido(nome)) return { erro: "Escreve o teu nome (só letras)." };
  if (!n9) return { erro: "WhatsApp inválido. Usa um número moçambicano, por exemplo 84 123 4567." };
  if (bairro.length < 2) return { erro: "Indica o teu bairro." };
  if (descricao && !validarTextoSeguro(descricao).ok) return { erro: "Não coloques contactos na descrição: os clientes falam contigo pelo botão do WhatsApp." };
  const loc = validarLocalizacao(form.get("cidade"), form.getAll("bairros"));
  if (!loc.ok) return { erro: loc.erro };
  const precoBruto = String(form.get("preco_base") ?? "").trim();
  const precoBase = precoBruto === "" ? null : Math.floor(Number(precoBruto));
  if (precoBase !== null && (!Number.isFinite(precoBase) || precoBase < 0 || precoBase > 100000000)) return { erro: "Preço base inválido." };
  const erroSenha = senhaValida(senha);
  if (erroSenha) return { erro: erroSenha };
  const foto = await lerImagem(form.get("foto"));
  if (!foto.ok) return { erro: foto.erro };

  const { hash, email } = identidade("profissional", n9);

  // 1 numero = 1 conta de profissional. Numero de conta suspensa nao cria conta nova.
  const { data: existente } = await admin
    .from("users")
    .select("id, status, trial_fim, pago_ate, plano_codigo, oculto_manual")
    .eq("role", "profissional")
    .eq("whatsapp_hash", hash)
    .maybeSingle();
  if (existente) {
    const r = calcularPlano(existente);
    if (r.estado === "suspenso" || r.estado === "banido" || r.escondidoManual) {
      return { erro: "Este número já tem uma conta suspensa. Fala com o suporte do ServiLink." };
    }
    return { erro: "Este número já tem conta de profissional. Faz login." };
  }

  // Possivel duplicado de um suspenso: mesmo nome + bairro + profissao, ou mesmo aparelho.
  const dispositivo = dispositivoAtual();
  const { data: mesmos } = await admin
    .from("users")
    .select("id, nome, bairro, categoria, dispositivo_hash, status, trial_fim, pago_ate, plano_codigo, oculto_manual")
    .eq("role", "profissional")
    .or(`categoria.eq.${categoria.slug}${dispositivo ? `,dispositivo_hash.eq.${dispositivo}` : ""}`)
    .limit(500);
  let duplicadoDe: string | null = null;
  for (const m of mesmos ?? []) {
    const r = calcularPlano(m);
    const suspenso = r.estado === "suspenso" || r.estado === "banido" || r.escondidoManual;
    if (!suspenso) continue;
    const mesmoPerfil =
      m.categoria === categoria.slug &&
      nomeNormalizado(m.nome) === nomeNormalizado(nome) &&
      nomeNormalizado(m.bairro ?? "") === nomeNormalizado(bairro);
    if (mesmoPerfil || (dispositivo && m.dispositivo_hash === dispositivo)) { duplicadoDe = m.id; break; }
  }

  const auth = await criarAuth(admin, email, senha);
  if ("erro" in auth) return { erro: auth.erro === "existe" ? "Este número já tem conta de profissional. Faz login." : "Não foi possível criar a conta. Tenta de novo." };

  const url = await guardarFoto(admin, "perfis", auth.id, foto);
  if (!url) {
    await admin.auth.admin.deleteUser(auth.id);
    return { erro: "Não foi possível guardar a foto. Tenta de novo." };
  }

  const { error } = await admin.from("users").insert({
    id: auth.id, role: "profissional", status: "pendente", nome, bairro, grupo,
    cidade: loc.cidade, bairros_atendimento: loc.bairros, preco_base: precoBase,
    categoria: categoria.slug, descricao: descricao || null, foto_url: url,
    whatsapp_enc: cifrar(n9), whatsapp_hash: hash, dispositivo_hash: dispositivo, duplicado_de: duplicadoDe,
  });
  if (error) {
    console.error("[cadastro profissional] insert falhou:", error.message);
    await admin.auth.admin.deleteUser(auth.id);
    return { erro: "Não foi possível criar a conta. Tenta de novo." };
  }
  await admin.from("contas_historico").upsert({ whatsapp_hash: hash, role: "profissional" }, { onConflict: "whatsapp_hash,role", ignoreDuplicates: true });

  // Fica "Pendente": sem sessao e sem aparecer nas buscas ate o admin aprovar.
  redirect("/em-analise?novo=1");
}
