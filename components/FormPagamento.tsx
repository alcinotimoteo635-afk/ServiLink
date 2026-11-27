"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import BotaoEnviar from "@/components/BotaoEnviar";
import CampoForm, { ESTILO_CAMPO } from "@/components/CampoForm";
import { pagarPlano, type Estado } from "@/app/planos/actions";

type Estados = "pending" | "success" | "failed";

// Acompanha o pedido junto do ServiLink (nunca da SkyWallet). Parar de perguntar NAO cancela o pagamento.
function Acompanhar({ orderId }: { orderId: string }) {
  const [estado, setEstado] = useState<Estados>("pending");
  const [msg, setMsg] = useState<string | null>(null);
  const [parou, setParou] = useState(false);

  useEffect(() => {
    let tentativas = 0;
    let ativo = true;
    const ciclo = async () => {
      if (!ativo) return;
      tentativas++;
      try {
        const r = await fetch(`/api/payments/skywallet/status?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setEstado(j.estado); setMsg(j.mensagem ?? null);
          if (j.estado !== "pending") return;
        }
      } catch { /* sem ligacao: tenta outra vez */ }
      if (tentativas >= 36) { setParou(true); return; }  // ~3 minutos
      setTimeout(ciclo, 5000);
    };
    ciclo();
    return () => { ativo = false; };
  }, [orderId]);

  if (estado === "success") {
    return (
      <div role="status" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-base text-emerald-900">
        <p className="font-bold">Pagamento confirmado! O teu plano PRO está ativo durante 90 dias.</p>
        <Link href="/painel" className="mt-2 inline-block font-bold underline">Ir para o meu painel</Link>
      </div>
    );
  }
  if (estado === "failed") {
    return <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-800">Não foi possível concluir o pagamento. Motivo: {msg}</p>;
  }
  return (
    <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-900">
      <p className="font-bold">Estamos à espera da confirmação do teu pagamento M-Pesa.</p>
      <p className="mt-1">Confirma o pedido no teu telemóvel com o PIN.{parou ? " Podes sair desta página: o ServiLink continua a acompanhar e o PRO ativa sozinho quando o pagamento for confirmado. Volta ao teu painel mais tarde." : ""}</p>
    </div>
  );
}

export default function FormPagamento({ nome, preco, dias, pedidoAtual }: { nome: string; preco: number; dias: number; pedidoAtual?: string }) {
  const [estado, acao] = useFormState<Estado, FormData>(pagarPlano, null);
  const orderId = estado?.orderId ?? pedidoAtual;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold text-escuro">Comprar o plano {nome}</h2>
      <p className="mt-1 text-base text-slate-700">{preco.toLocaleString("pt-MZ")} MT por {dias} dias. Sem renovação automática: renovas quando quiseres.</p>

      {!orderId && (
        <form action={acao} className="mt-4 space-y-4">
          <div className="max-w-sm">
            <CampoForm id="numero" rotulo="Número M-Pesa" ajuda="Só números 84 ou 85. Vais receber um pedido no telemóvel.">
              <input id="numero" name="numero" type="tel" inputMode="numeric" required placeholder="84 123 4567" className={ESTILO_CAMPO} />
            </CampoForm>
          </div>
          <label className="flex items-start gap-2 text-base text-texto">
            <input type="checkbox" name="confirmo" required className="mt-1 h-5 w-5" />
            Confirmo pagar {preco.toLocaleString("pt-MZ")} MT por {dias} dias de plano {nome}.
          </label>
          {estado?.erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-700">{estado.erro}</p>}
          <BotaoEnviar rotulo="Pagar com M-Pesa" carregando="A enviar o pedido..." />
        </form>
      )}
      {orderId && <Acompanhar orderId={orderId} />}
      {orderId && estado?.erro && <p className="mt-2 text-base text-amber-900">{estado.erro}</p>}
    </div>
  );
}
