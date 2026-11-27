import crypto from "crypto";

// Cliente da API SkyWallet (so servidor). Credenciais SO em variaveis de ambiente.
// Endpoints (documentacao fornecida): POST /api/developer/payment/request e
// GET /api/developer/payment/status?order_id=... Cabecalhos X-SK-ID e X-API-Key.

const BASE = () => (process.env.SKYWALLET_API_BASE || "https://skywallet-api.bluesparkmz.com").replace(/\/+$/, "");

export function skywalletConfigurado(): boolean {
  return Boolean(process.env.SKYWALLET_SK_ID && process.env.SKYWALLET_API_KEY && process.env.SKYWALLET_WEBHOOK_SECRET);
}

// Numero M-Pesa: 9 digitos, prefixo 84 ou 85. Devolve string (nunca inteiro).
export function normalizarMsisdn(entrada: string): string | null {
  let d = String(entrada ?? "").replace(/[\s\-().]/g, "");
  if (d.startsWith("+258")) d = d.slice(4);
  else if (d.startsWith("00258")) d = d.slice(5);
  else if (d.startsWith("258") && d.length === 12) d = d.slice(3);
  return /^8[45]\d{7}$/.test(d) ? d : null;
}

// order_id: prefixo SERVI + 15 caracteres aleatorios = 20 (alfanumerico, sem hifens).
export function novoOrderId(): string {
  return ("SERVI" + crypto.randomBytes(8).toString("hex").toUpperCase()).slice(0, 20);
}

// Limite de pedidos (documentacao: 10/min para pagamentos, 60/min para consultas). Por instancia.
const janelas = new Map<string, number[]>();
function dentroDoLimite(chave: string, max: number): boolean {
  const agora = Date.now();
  const lista = (janelas.get(chave) ?? []).filter((t) => agora - t < 60_000);
  if (lista.length >= max) { janelas.set(chave, lista); return false; }
  lista.push(agora);
  janelas.set(chave, lista);
  return true;
}

// Mensagem segura para o utilizador: nunca mostra codigos tecnicos (INS-*, stack, etc.).
export function mensagemSegura(erro: unknown): string {
  const t = String(erro ?? "").replace(/\bINS-?\d+\b:?/gi, "").replace(/\s+/g, " ").trim();
  if (!t || t.length > 160 || /[{}<>]|error|exception|undefined|null/i.test(t)) return "O pagamento não foi concluído. Tenta de novo.";
  return t;
}

async function chamar(caminho: string, init: RequestInit = {}): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15_000);
  try {
    return await fetch(`${BASE()}${caminho}`, {
      ...init,
      headers: {
        "X-SK-ID": process.env.SKYWALLET_SK_ID ?? "",
        "X-API-Key": process.env.SKYWALLET_API_KEY ?? "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: ctl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export type ResultadoPedido =
  | { resultado: "aceite" }
  | { resultado: "rejeitado"; erro: string }
  | { resultado: "incerto" }           // timeout / rede: NAO assumir falha; consultar o estado
  | { resultado: "limite" };

export async function pedirPagamento(p: { msisdn: string; amount: number; description: string; orderId: string }): Promise<ResultadoPedido> {
  if (!dentroDoLimite("pedido", 10)) return { resultado: "limite" };
  let res: Response;
  try {
    res = await chamar("/api/developer/payment/request", {
      method: "POST",
      body: JSON.stringify({ msisdn: p.msisdn, amount: p.amount, currency: "MZN", description: p.description, order_id: p.orderId }),
    });
  } catch {
    return { resultado: "incerto" };
  }
  let corpo: any = null;
  try { corpo = await res.json(); } catch { /* corpo invalido */ }

  if (res.ok) {
    // A resposta inicial so significa "pedido aceite". O PRO so ativa com confirmacao autentica.
    if (corpo && (corpo.status === "failed" || corpo.success === false)) return { resultado: "rejeitado", erro: mensagemSegura(corpo.error ?? corpo.message) };
    return { resultado: "aceite" };
  }
  if (res.status >= 500 || res.status === 429) return { resultado: "incerto" };
  console.error("[skywallet] pedido recusado, HTTP", res.status);
  return { resultado: "rejeitado", erro: mensagemSegura(corpo?.error ?? corpo?.message) };
}

export type EstadoRemoto = { estado: "pending" | "success" | "failed"; erro?: string; amount?: number; currency?: string };

// null = nao foi possivel saber (rede, limite, resposta inesperada). Nunca tratar null como falha.
export async function consultarEstado(orderId: string): Promise<EstadoRemoto | null> {
  if (!/^[A-Za-z0-9]{1,20}$/.test(orderId)) return null;
  if (!dentroDoLimite("estado", 60)) return null;
  try {
    const res = await chamar(`/api/developer/payment/status?order_id=${encodeURIComponent(orderId)}`);
    if (!res.ok) return null;
    const j: any = await res.json();
    const e = String(j?.status ?? "").toLowerCase();
    if (e !== "pending" && e !== "success" && e !== "failed") return null;
    const amount = j?.amount !== undefined && j?.amount !== null ? Number(j.amount) : undefined;
    return { estado: e, erro: e === "failed" ? mensagemSegura(j?.error) : undefined, amount: Number.isFinite(amount as number) ? amount : undefined, currency: j?.currency ? String(j.currency) : undefined };
  } catch {
    return null;
  }
}

// ---- Webhook: HMAC-SHA256 do JSON com chaves ordenadas e sem espacos (formato documentado) ----
function ordenar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(ordenar);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, ordenar((v as Record<string, unknown>)[k])]));
  }
  return v;
}
// Igual ao Python json.dumps(sort_keys=True, separators=(',', ':')) da documentacao: ensure_ascii=True,
// ou seja, caracteres nao ASCII (c, a com til...) saem como \uXXXX. Sem isto, avisos com acentos falhavam a assinatura.
export const serializarCanonico = (payload: unknown) =>
  JSON.stringify(ordenar(payload)).replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

export function assinaturaValida(payload: unknown, cabecalho: string | null): boolean {
  const segredo = process.env.SKYWALLET_WEBHOOK_SECRET;
  if (!segredo || !cabecalho) return false;
  const recebida = cabecalho.trim().replace(/^sha256=/i, "").toLowerCase();
  const calculada = crypto.createHmac("sha256", segredo).update(serializarCanonico(payload)).digest("hex");
  const a = Buffer.from(recebida, "utf8");
  const b = Buffer.from(calculada, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
