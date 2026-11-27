import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { assinaturaValida } from "@/lib/skywallet";
import { aplicarEstado } from "@/lib/pagamento-plano";

export const dynamic = "force-dynamic";

const semSk = (v: string) => v.trim().toLowerCase().replace(/^sk-/, "");

// Webhook da SkyWallet. So age depois de validar a assinatura HMAC-SHA256 (X-Webhook-Signature).
export async function POST(req: Request) {
  let payload: any;
  try {
    const texto = await req.text();
    if (texto.length > 20_000) return NextResponse.json({ ok: false }, { status: 413 });
    payload = JSON.parse(texto);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!assinaturaValida(payload, req.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (payload?.event_type !== "developer.payment") return NextResponse.json({ ok: true, ignorado: true });

  const meu = process.env.SKYWALLET_SK_ID ?? "";
  if (!payload.developer_sk_id || semSk(String(payload.developer_sk_id)) !== semSk(meu)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const orderId = String(payload.order_id ?? "");
  const estado = String(payload.status ?? "").toLowerCase();
  if (!/^[A-Za-z0-9]{1,20}$/.test(orderId) || !["pending", "success", "failed"].includes(estado)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = criarClienteAdmin();
  const { data: pg } = await admin.from("pagamentos_plano")
    .select("id, user_id, status, referencia, valor, moeda, created_at, atualizado_em").eq("referencia", orderId).maybeSingle();
  if (!pg) {
    await admin.from("eventos_pagamento").insert({ order_id: orderId, origem: "webhook", estado, resultado: "ignorado", detalhe: "order_id desconhecido" });
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const amount = payload.amount !== undefined && payload.amount !== null ? Number(payload.amount) : undefined;
  await aplicarEstado(admin, pg, {
    estado: estado as "pending" | "success" | "failed",
    erro: payload.error ? String(payload.error) : undefined,
    amount: Number.isFinite(amount as number) ? amount : undefined,
    currency: payload.currency ? String(payload.currency) : undefined,
  }, "webhook");

  // Responde sempre 200 a eventos autenticados (duplicados incluidos) para o fornecedor nao reenviar sem fim.
  return NextResponse.json({ ok: true });
}
