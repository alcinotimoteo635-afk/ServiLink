import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 1) Renova a sessao quando o token expira (so faz pedido ao Supabase se for preciso).
// 2) Cria o identificador anonimo do aparelho (cookie HttpOnly) usado so contra contas duplicadas.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const producao = process.env.NODE_ENV === "production";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && chave && request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    const supabase = createServerClient(url, chave, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(lista) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, httpOnly: true, secure: producao, sameSite: "lax" })
          );
        },
      },
    });
    try {
      await supabase.auth.getSession();
    } catch {
      // sem sessao valida: segue como visitante
    }
  }

  if (!request.cookies.get("sl_dev")) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    response.cookies.set("sl_dev", id, {
      httpOnly: true, secure: producao, sameSite: "lax", maxAge: 60 * 60 * 24 * 730, path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo\\.|hero|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)"],
};
