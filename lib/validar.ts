// Validacao de entradas (sempre repetida no servidor).

// Numero movel de Mocambique: 9 digitos, prefixos 82 a 87. Aceita +258 / 258 / 00258.
export function normalizarWhatsapp(entrada: string): string | null {
  let n = String(entrada ?? "").replace(/[^\d]/g, "");
  if (n.startsWith("00258")) n = n.slice(5);
  else if (n.startsWith("258") && n.length === 12) n = n.slice(3);
  return /^8[2-7]\d{7}$/.test(n) ? n : null;
}

export const mascarar = (n9: string) => `${n9.slice(0, 2)}*****${n9.slice(-2)}`;

// Remove marcas HTML, caracteres de controlo e espacos repetidos.
export function limparTexto(t: unknown, max: number): string {
  return String(t ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function nomeValido(nome: string): boolean {
  return nome.length >= 2 && nome.length <= 80 && /^[\p{L}\p{M}0-9 .'\-]+$/u.test(nome);
}

export function senhaValida(s: string): string | null {
  if (s.length < 8) return "A palavra-passe deve ter pelo menos 8 caracteres.";
  if (s.length > 72) return "A palavra-passe é demasiado longa.";
  return null;
}

// So caminhos internos (evita redirecionar para sites externos).
export function caminhoSeguro(next: unknown, padrao = "/painel"): string {
  const s = String(next ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.includes("\\") ? s : padrao;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Upload: so JPG, PNG, WEBP ate 2 MB. O tipo e confirmado pelos primeiros bytes,
// nao pelo nome nem pelo tipo que o navegador diz.
export async function lerImagem(
  f: FormDataEntryValue | null
): Promise<{ ok: true; bytes: Buffer; ext: "jpg" | "png" | "webp"; mime: string } | { ok: false; erro: string }> {
  if (!(f instanceof File) || f.size === 0) return { ok: false, erro: "Escolha uma foto." };
  if (f.size > 2 * 1024 * 1024) return { ok: false, erro: "A foto deve ter no máximo 2 MB." };
  const bytes = Buffer.from(await f.arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ok: true, bytes, ext: "jpg", mime: "image/jpeg" };
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ok: true, bytes, ext: "png", mime: "image/png" };
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return { ok: true, bytes, ext: "webp", mime: "image/webp" };
  return { ok: false, erro: "Só são aceites fotos JPG, PNG ou WEBP." };
}
