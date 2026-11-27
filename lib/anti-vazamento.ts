// Bloqueio de contactos externos para descricao de pedidos e chat.
// Usado no cliente (bloqueio ao digitar) e no servidor (validacao final).

export const AVISO_ANTI_VAZAMENTO =
  "Por sua segurança, contactos externos não são permitidos antes do pagamento. Use o chat do ServiLink.";

// Normaliza o texto para apanhar tentativas de disfarce: espacos, pontos,
// hifens e parenteses entre digitos, e variacoes de maiusculas.
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function soDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

const PADROES_TEXTO: RegExp[] = [
  /\+\s*258/, // +258
  /\b258\s*[-. ]?\s*\d/, // 258 seguido de digito
  /@/, // email
  /whats\s*app|wa\.me|zap\b/, // whatsapp
  /e[-\s]?mail|gmail|hotmail|outlook|yahoo/, // email
  /\.\s*com\b|\.\s*co\.mz\b|\.\s*mz\b|\.\s*net\b|\.\s*org\b/, // dominios
  /https?:|:\/\//, // http
  /\bwww\b/, // www
  /facebook|instagram|telegram|tiktok|linkedin|messenger/, // redes
  /contacto|contato|contacte|ligue|liga-me|me chama/, // pedidos de contacto
];

export function contemContactoExterno(texto: string): boolean {
  if (!texto) return false;
  const t = normalizar(texto);

  if (PADROES_TEXTO.some((p) => p.test(t))) return true;

  // Numeros de telefone mocambicanos: prefixos 82..87 + 7 digitos,
  // com ou sem 258 na frente, mesmo separados por espacos ou pontuacao.
  const digitos = soDigitos(t);
  if (/(?:258)?8[2-7]\d{7}/.test(digitos)) return true;

  // Qualquer sequencia de 9 ou mais digitos (mesmo com separadores).
  if (/\d{9,}/.test(digitos)) return true;

  // 8 digitos seguidos comecando por 8 (formato 8xxxxxxx).
  if (/(?:^|\D)8\d{7}(?:\D|$)/.test(t.replace(/[\s.\-()]/g, " ").replace(/(\d) (?=\d)/g, "$1"))) {
    return true;
  }

  return false;
}

export function validarTextoSeguro(texto: string): {
  ok: boolean;
  aviso?: string;
} {
  if (contemContactoExterno(texto)) {
    return { ok: false, aviso: AVISO_ANTI_VAZAMENTO };
  }
  return { ok: true };
}
