import { criarClienteAdmin } from "@/lib/supabase/admin";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { CATEGORIAS, type Grupo } from "@/lib/categorias";

export type ProCard = {
  id: string;
  nome: string;
  bairro: string | null;
  cidade: string | null;
  bairros_atendimento: string[] | null;
  preco_base: number | null;
  grupo: Grupo;
  categoria: string;
  descricao: string | null;
  foto_url: string | null;
  galeria: string[];
  verificado: boolean;
  plano_ativo: "essencial" | "pro" | null;
  prioridade: number;
  nota_media: number;
  total_avaliacoes: number;
  home_destaque_mes: string | null;
};

const COLUNAS =
  "id, nome, bairro, cidade, bairros_atendimento, preco_base, grupo, categoria, descricao, foto_url, galeria, verificado, plano_ativo, prioridade, nota_media, total_avaliacoes, home_destaque_mes";

type Filtros = { grupo?: Grupo; categoria?: string; q?: string; bairro?: string; cidade?: string; pagina?: number; porPagina?: number; limite?: number };

// Ordem justa: plano (PRO > Destaque > Essencial > teste gratis) e, dentro do mesmo nivel,
// uma ordem que muda todos os dias (para ninguem ficar sempre em ultimo).
function chaveDoDia(id: string): number {
  const dia = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 10);
  let h = 0;
  for (const c of id + dia) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

const semAcentos = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export async function listarProfissionais(f: Filtros = {}): Promise<{ itens: ProCard[]; total: number }> {
  if (!supabaseConfigurado()) return { itens: [], total: 0 };
  try {
    let c = criarClienteAdmin().from("v_profissionais").select(COLUNAS).limit(600);
    if (f.grupo) c = c.eq("grupo", f.grupo);
    if (f.categoria) c = c.eq("categoria", f.categoria);

    const bairro = (f.bairro ?? "").replace(/[,()%*\\]/g, " ").trim();
    if (f.cidade) c = c.eq("cidade", f.cidade);
    // Bairro: onde mora OU um dos bairros onde atende.
    if (bairro) c = c.or(`bairro.ilike.%${bairro.replace(/["{}]/g, " ")}%,bairros_atendimento.cs.{"${bairro.replace(/["{}]/g, " ")}"}`);

    const q = (f.q ?? "").replace(/[,()%*\\]/g, " ").trim();
    if (q) {
      const qn = semAcentos(q);
      const slugs = CATEGORIAS.filter((x) => semAcentos(x.nome).includes(qn) || x.slug.includes(qn)).map((x) => x.slug);
      const partes = [`nome.ilike.%${q}%`, `descricao.ilike.%${q}%`, `bairro.ilike.%${q}%`];
      if (slugs.length) partes.push(`categoria.in.(${slugs.join(",")})`);
      c = c.or(partes.join(","));
    }

    const { data, error } = await c;
    if (error || !data) {
      if (error) console.error("[profissionais] consulta falhou:", error.message);
      return { itens: [], total: 0 };
    }
    const todos = (data as unknown as ProCard[]).sort(
      (a, b) => b.prioridade - a.prioridade || chaveDoDia(a.id) - chaveDoDia(b.id)
    );
    if (f.limite) return { itens: todos.slice(0, f.limite), total: todos.length };
    const por = f.porPagina ?? 12;
    const pagina = Math.max(1, f.pagina ?? 1);
    return { itens: todos.slice((pagina - 1) * por, pagina * por), total: todos.length };
  } catch (e) {
    console.error("[profissionais] erro:", e);
    return { itens: [], total: 0 };
  }
}

export async function contagemPorCategoria(): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (!supabaseConfigurado()) return mapa;
  try {
    const { data } = await criarClienteAdmin().from("v_profissionais").select("categoria").limit(5000);
    for (const r of data ?? []) mapa.set(r.categoria, (mapa.get(r.categoria) ?? 0) + 1);
  } catch {
    // sem dados
  }
  return mapa;
}

export async function bairrosSugeridos(grupo?: Grupo): Promise<string[]> {
  if (!supabaseConfigurado()) return [];
  try {
    let c = criarClienteAdmin().from("v_profissionais").select("bairro").not("bairro", "is", null).limit(1000);
    if (grupo) c = c.eq("grupo", grupo);
    const { data } = await c;
    return Array.from(new Set((data ?? []).map((r) => String(r.bairro).trim()).filter(Boolean))).sort().slice(0, 60);
  } catch {
    return [];
  }
}

// "1x por mes na inicial": profissionais PRO que o admin destacou neste mes.
export async function destaquesDoMes(grupo: Grupo): Promise<ProCard[]> {
  if (!supabaseConfigurado()) return [];
  try {
    const mes = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 7);
    const { data } = await criarClienteAdmin()
      .from("v_profissionais")
      .select(COLUNAS)
      .eq("grupo", grupo)
      .eq("plano_ativo", "pro")
      .eq("home_destaque_mes", mes)
      .limit(3);
    return (data ?? []) as unknown as ProCard[];
  } catch {
    return [];
  }
}
