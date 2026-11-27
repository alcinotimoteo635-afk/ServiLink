import crypto from "crypto";

// Segredo so no servidor (DADOS_CHAVE). Gere com:  openssl rand -hex 32
function segredo(): string {
  const s = (process.env.DADOS_CHAVE ?? "").trim();
  if (s.length < 32) {
    throw new Error("DADOS_CHAVE em falta ou curta (minimo 32 caracteres). Gere com: openssl rand -hex 32");
  }
  return s;
}

function chaveAes(): Buffer {
  return crypto.createHash("sha256").update("aes:" + segredo()).digest();
}

// AES-256-GCM. Formato: v1.iv.tag.cifrado (base64url).
export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", chaveAes(), iv);
  const cifrado = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), cifrado.toString("base64url")].join(".");
}

export function decifrar(payload: string): string {
  const [v, iv, tag, dados] = payload.split(".");
  if (v !== "v1" || !iv || !tag || !dados) throw new Error("Formato invalido");
  const d = crypto.createDecipheriv("aes-256-gcm", chaveAes(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(dados, "base64url")), d.final()]).toString("utf8");
}

// Hash com chave (HMAC): serve para garantir 1 numero = 1 conta e para o login,
// sem guardar o numero em claro e sem permitir adivinhar numeros a partir do hash.
export function hashHmac(prefixo: string, valor: string): string {
  return crypto.createHmac("sha256", segredo()).update(`${prefixo}:${valor}`).digest("hex");
}

export const hashWhatsapp = (n9: string) => hashHmac("wa", n9);

// E-mail interno (nunca mostrado nem usado para enviar mensagens): o Supabase Auth exige um
// identificador, e assim o utilizador entra so com o WhatsApp e a palavra-passe.
export function emailInterno(role: "cliente" | "profissional", hashWa: string): string {
  return `${role === "profissional" ? "p" : "c"}${hashWa.slice(0, 40)}@wa.servilink.co.mz`;
}
