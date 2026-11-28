// Parceiros do ServiLink. Para adicionar o SEGUNDO (ou mais): poe o logo em public/parceiros/
// e acrescenta uma linha na lista PARCEIROS, por exemplo:
//   { nome: "Nome do Parceiro", logo: "/parceiros/nome.png", link: "https://..." },
// Os parceiros aparecem em 2 colunas no telemovel (4 no PC). Sem link, o cartao fica sem clique.
export type Parceiro = { nome: string; logo: string; link?: string; fundoEscuro?: boolean };

export const ALTIS_LINK = "https://altis-mz.vercel.app";

export const PARCEIROS: Parceiro[] = [
  { nome: "ALTIS - Soluções Tecnológicas", logo: "/parceiros/altis.webp", link: ALTIS_LINK, fundoEscuro: true },
];

// Usado so quando a lista PARCEIROS estiver vazia (espacos reservados).
export const ESPACOS_RESERVADOS = 4;
