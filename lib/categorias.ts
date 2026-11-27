// Apenas 2 grupos e estas categorias. Nao acrescentar outras sem decisao do dono do produto.
export type Grupo = "digital" | "domicilio";

export const GRUPOS: Record<Grupo, { slug: Grupo; nome: string; botao: string; profissional: string }> = {
  digital: {
    slug: "digital",
    nome: "Serviços Digitais",
    botao: "SERVIÇOS DIGITAIS",
    profissional: "Técnico Digital",
  },
  domicilio: {
    slug: "domicilio",
    nome: "Técnico ao Domicílio",
    botao: "TÉCNICO AO DOMICÍLIO",
    profissional: "Técnico ao Domicílio",
  },
};

export type Categoria = { slug: string; nome: string; grupo: Grupo };

export const CATEGORIAS: Categoria[] = [
  // SERVIÇOS DIGITAIS
  { slug: "designer-grafico", nome: "Designer Gráfico", grupo: "digital" },
  { slug: "editor-de-video", nome: "Editor de Vídeo", grupo: "digital" },
  { slug: "programador", nome: "Programador / Criador de Sites", grupo: "digital" },
  { slug: "social-media", nome: "Social Media", grupo: "digital" },
  { slug: "fotografo-videografo", nome: "Fotógrafo / Videógrafo", grupo: "digital" },
  { slug: "explicador-online", nome: "Explicador Online", grupo: "digital" },
  { slug: "assistente-virtual", nome: "Assistente Virtual", grupo: "digital" },
  { slug: "marketing-digital", nome: "Marketing Digital", grupo: "digital" },
  // TÉCNICO AO DOMICÍLIO
  { slug: "electricista", nome: "Electricista", grupo: "domicilio" },
  { slug: "canalizador", nome: "Canalizador", grupo: "domicilio" },
  { slug: "pintor", nome: "Pintor", grupo: "domicilio" },
  { slug: "tecnico-de-ac", nome: "Técnico de AC", grupo: "domicilio" },
  { slug: "tecnico-de-congeladores", nome: "Técnico de Congeladores / Geleiras", grupo: "domicilio" },
  { slug: "exterminador", nome: "Exterminador de Insectos / Ratos", grupo: "domicilio" },
  { slug: "mecanico-ao-domicilio", nome: "Mecânico ao Domicílio", grupo: "domicilio" },
  { slug: "tecnico-de-tv-dstv", nome: "Técnico de TV / DSTV", grupo: "domicilio" },
  { slug: "jardineiro-limpeza", nome: "Jardineiro / Limpeza", grupo: "domicilio" },
];

export const categoriasDoGrupo = (g: Grupo) => CATEGORIAS.filter((c) => c.grupo === g);
export const categoriaPorSlug = (slug: string | null | undefined) =>
  CATEGORIAS.find((c) => c.slug === slug) ?? null;

export function grupoValido(v: string | null | undefined): Grupo | null {
  return v === "digital" || v === "domicilio" ? v : null;
}
