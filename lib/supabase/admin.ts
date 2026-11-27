import { createClient } from "@supabase/supabase-js";

// Cliente com service role. Usar SOMENTE em codigo de servidor
// (server actions, rotas de API, cron). Nunca importar em componentes cliente.
export function criarClienteAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const chave = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!/^https?:\/\/[^\s/]+\.[^\s]*$/i.test(url)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL invalida no .env.local. Use o Project URL, por exemplo https://abcdxyz.supabase.co"
    );
  }
  if (!chave) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY em falta no .env.local.");
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
