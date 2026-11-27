// Lista curta de palavroes e insultos comuns em portugues, usada so para SINALIZAR
// avaliacoes no painel do admin. Quem decide apagar e o admin.
const LISTA = [
  "merda", "porra", "caralho", "puta", "foda", "fodase", "fdp", "cabrao",
  "idiota", "imbecil", "estupido", "otario", "cretino", "vagabundo", "corno",
];

function normalizar(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function temPalavrao(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const limpo = normalizar(texto);
  return LISTA.some((p) => new RegExp(`(^|[^a-z])${p}([^a-z]|$)`).test(limpo));
}
