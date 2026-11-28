// Parceiros do ServiLink. Para adicionar um: poe o logo em public/parceiros/ e
// acrescenta uma linha aqui, por exemplo:
//   { nome: "Nome do Parceiro", descricao: "O que faz", logo: "/parceiros/nome.png", link: "https://...", oficial: true }
// Enquanto a lista estiver vazia, a pagina mostra os espacos reservados.
export type Parceiro = {
  nome: string;
  descricao?: string;
  logo: string;
  link?: string;
  fundoEscuro?: boolean;
  oficial?: boolean;
};

// SITE DA ALTIS: poe aqui o endereco quando o tiveres (ex.: "https://www.altis.co.mz").
// Vazio = o botao "Visitar" aparece desativado e o nome ALTIS no rodape fica sem link.
export const ALTIS_LINK = "";

export const PARCEIROS: Parceiro[] = [
  {
    nome: "ALTIS",
    descricao: "Parceiro tecnológico da ServiLink",
    logo: "/parceiros/altis.webp",
    link: ALTIS_LINK || undefined,
    fundoEscuro: true,
    oficial: true,
  },
];
export const ESPACOS_RESERVADOS = 4;
