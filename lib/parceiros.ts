// Parceiros do ServiLink. Para adicionar um: poe o logo em public/parceiros/ e
// acrescenta uma linha aqui, por exemplo:
//   { nome: "Nome do Parceiro", logo: "/parceiros/nome.png", link: "https://..." }
// Enquanto a lista estiver vazia, a pagina mostra os espacos reservados.
export type Parceiro = { nome: string; logo: string; link?: string; fundoEscuro?: boolean };
// Site da ALTIS: preenche quando tiveres o endereco (ex.: "https://..."). Vazio = ALTIS aparece sem link.
export const ALTIS_LINK = "";
export const PARCEIROS: Parceiro[] = [
  { nome: "ALTIS - Soluções Tecnológicas", logo: "/parceiros/altis.webp", link: ALTIS_LINK || undefined, fundoEscuro: true },
];
export const ESPACOS_RESERVADOS = 4;
