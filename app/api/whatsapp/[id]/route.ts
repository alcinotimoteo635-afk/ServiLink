import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterSessao } from "@/lib/sessao";
import { decifrar } from "@/lib/cripto";
import { categoriaPorSlug } from "@/lib/categorias";
import { UUID } from "@/lib/validar";
import { dispositivoAtual } from "@/lib/seguranca";
import { profissionaisContactadosHoje } from "@/lib/whatsapp-limite";
import { profissionaisContactadosHoje } from "@/lib/whatsapp-limite";

export const dynamic = "force-dynamic";

// Botao "Falar no WhatsApp": o numero nunca vai no HTML. O cliente (com conta) passa por
// aqui, o clique e contado e so entao e redirecionado para o WhatsApp do profissional.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const base = new URL(req.url).origin;
  const voltar = (caminho: string) => NextResponse.redirect(new URL(caminho, base), 303);
  const semCache = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

  if (!UUID.test(params.id)) return voltar("/profissionais");

  const sessao = await obterSessao();
  if (sessao?.role === "profissional") return voltar(`/profissional/${params.id}?aviso=pro`);

  const admin = criarClienteAdmin();
  // So profissionais visiveis ao publico (aprovado, dentro do periodo, nao escondido).
  const { data: v } = await admin.from("v_profissionais").select("id, nome, categoria").eq("id", params.id).maybeSingle();
  if (!v) return voltar("/profissionais");

  const { data: u } = await admin.from("users").select("whatsapp_enc, whatsapp_hash").eq("id", params.id).single();
  if (!u?.whatsapp_enc) return voltar(`/profissional/${params.id}`);

  let numero: string;
  try {
    numero = decifrar(u.whatsapp_enc);
  } catch {
    console.error("[whatsapp] nao foi possivel decifrar (DADOS_CHAVE mudou?)");
    return voltar(`/profissional/${params.id}?aviso=erro`);
  }

  // Limite: 1 clique por dia (dia de Maputo) em cada profissional, para quem tem conta (cliente) ou nao (aparelho).
  const clienteId = sessao?.role === "cliente" ? sessao.id : null;
  const dispositivo = dispositivoAtual();
  if (sessao?.role !== "admin") {
    const contactados = await profissionaisContactadosHoje(admin, clienteId, dispositivo);
    if (contactados.has(params.id)) return voltar(`/profissional/${params.id}?aviso=limite`);

    // Limite anti-recolha de numeros: no maximo 30 contactos por hora por visitante.
    if (clienteId || dispositivo) {
      const filtro = [clienteId ? `cliente_id.eq.${clienteId}` : null, dispositivo ? `dispositivo_hash.eq.${dispositivo}` : null].filter(Boolean).join(",");
      const { count } = await admin.from("cliques_whatsapp").select("id", { count: "exact", head: true }).or(filtro).gt("created_at", new Date(Date.now() - 3600 * 1000).toISOString());
      if ((count ?? 0) >= 30) return voltar(`/profissional/${params.id}?aviso=limite`);
    }
    await admin.from("cliques_whatsapp").insert({ profissional_id: params.id, profissional_hash: u.whatsapp_hash, cliente_id: clienteId, dispositivo_hash: dispositivo });
  }

  const cat = categoriaPorSlug(v.categoria)?.nome ?? "um serviço";
  const texto = `Olá ${String(v.nome).split(" ")[0]}, vi o teu perfil no ServiLink e preciso de ${cat}.`;
  const resp = NextResponse.redirect(`https://wa.me/258${numero}?text=${encodeURIComponent(texto)}`, 302);
  Object.entries(semCache).forEach(([k, val]) => resp.headers.set(k, val));
  return resp;
}
