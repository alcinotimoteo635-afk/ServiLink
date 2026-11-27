// Cidades e bairros de atendimento. Lista editavel (acrescentar bairros aqui). Os bairros pertencem a UMA cidade.
export const LOCALIDADES: Record<string, string[]> = {
  Maputo: [
    "Alto-Maé", "Baixa", "Central", "Chamanculo", "Coop", "Costa do Sol", "Fomento", "Hulene", "Jardim", "Laulane",
    "Mafalala", "Magoanine", "Mahotas", "Malanga", "Malhangalene", "Maxaquene", "Mavalane", "Museu", "Polana Cimento",
    "Polana Caniço", "Ponta-Vermelha", "Sommerschield", "Triunfo", "Xipamanine", "Zimpeto",
  ],
  Matola: [
    "Matola-Gare", "Machava", "Liberdade", "Fomento", "Patrice Lumumba", "Tchumene", "Malhampsene", "T3", "Ndlavela",
    "Infulene", "Matola Rio", "Bunhiça", "Khongolote", "Mussumbuluku",
  ],
};
export const CIDADES = Object.keys(LOCALIDADES);

// Valida no servidor: cidade conhecida; bairros todos dessa cidade; sem duplicados.
export function validarLocalizacao(cidade: unknown, bairros: unknown[]): { ok: true; cidade: string; bairros: string[] } | { ok: false; erro: string } {
  const c = String(cidade ?? "");
  if (!CIDADES.includes(c)) return { ok: false, erro: "Escolhe a cidade onde atendes." };
  const validos = LOCALIDADES[c];
  const unicos = Array.from(new Set(bairros.map((b) => String(b))));
  if (unicos.length === 0) return { ok: false, erro: "Escolhe pelo menos um bairro onde atendes." };
  if (unicos.length > 15 || unicos.some((b) => !validos.includes(b))) return { ok: false, erro: "Há bairros que não pertencem a essa cidade." };
  return { ok: true, cidade: c, bairros: unicos };
}

export const todosOsBairros = () => Array.from(new Set(Object.values(LOCALIDADES).flat())).sort();
