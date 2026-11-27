import PaginaTexto from "@/components/PaginaTexto";
import FormReclamacao from "@/components/FormReclamacao";
import { CONTACTOS } from "@/lib/contactos";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { fmtData } from "@/lib/datas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Livro de Reclamações - ServiLink" };

export default async function Reclamacoes() {
  // Publico: nunca mostra nome, contacto nem o id do autor. O nome aparece sempre como SIGILO.
  let publicas: { id: string; texto: string; resposta: string | null; created_at: string }[] = [];
  if (supabaseConfigurado()) {
    const { data } = await criarClienteAdmin().from("reclamacoes").select("id, texto, resposta, created_at").eq("publica", true).order("created_at", { ascending: false }).limit(10);
    publicas = data ?? [];
  }
  const wa = `${CONTACTOS.whatsapp}`;
  return (
    <PaginaTexto titulo="Livro de Reclamações" subtitulo="Tens uma queixa ou sugestão? Diz-nos.">
      <p>Escreve a tua reclamação abaixo ou usa o WhatsApp. O teu nome e contacto, se os deixares, ficam guardados só para a equipa ServiLink analisar e responder. Não aparecem a outros utilizadores: na página pública o nome é sempre <strong>SIGILO</strong>. Isto não é anonimato absoluto: a equipa autorizada vê os dados que enviares.</p>
      <FormReclamacao />
      <ul className="space-y-2 text-lg">
        <li><strong>Email:</strong> <a className="text-primaria underline" href={`mailto:${CONTACTOS.email}`}>{CONTACTOS.email}</a></li>
        <li><strong>Telefone / WhatsApp:</strong> <a className="text-primaria underline" href={CONTACTOS.telefoneLink}>{CONTACTOS.telefone}</a></li>
      </ul>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-whats px-6 py-3 text-base font-bold text-white hover:opacity-90">Reclamar pelo WhatsApp</a>

      {publicas.length > 0 && (
        <div className="pt-4">
          <h2 className="text-xl font-bold text-escuro">Reclamações analisadas</h2>
          <ul className="mt-3 space-y-3">
            {publicas.map((r) => (
              <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-base font-bold text-escuro">SIGILO <span className="font-normal text-slate-500">· {fmtData(r.created_at).slice(0, 10)}</span></p>
                <p className="mt-1">{r.texto}</p>
                {r.resposta && <p className="mt-2 rounded-lg bg-hero p-3 text-base"><strong>Resposta ServiLink:</strong> {r.resposta}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </PaginaTexto>
  );
}
