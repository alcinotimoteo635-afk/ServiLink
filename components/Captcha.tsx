"use client";

import Script from "next/script";

// CAPTCHA anti-bots (Cloudflare Turnstile, gratuito). So aparece se as chaves estiverem
// configuradas; o token segue no formulario e o servidor confirma-o.
export default function Captcha() {
  const chave = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!chave) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={chave} data-language="pt" />
    </>
  );
}
