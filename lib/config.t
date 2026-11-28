// =====================================================================================
// CONFIGURACAO CENTRAL DO SERVILINK
// =====================================================================================
// ONDE COLOCAR AS CHAVES (nunca no codigo, nunca no GitHub):
//   Vercel > teu projeto > Settings > Environment Variables > Add
//   Depois de guardar, vai a Deployments > ... > Redeploy para as chaves entrarem em uso.
//
//   Pagamentos (SkyWallet):
//     SKYWALLET_SK_ID           (comeca por "Sk-")
//     SKYWALLET_API_KEY         (comeca por "sk_")
//     SKYWALLET_WEBHOOK_SECRET  (segredo que tu defines no portal da SkyWallet)
//
//   Captcha (Cloudflare Turnstile, gratuito):
//     NEXT_PUBLIC_TURNSTILE_SITE_KEY   (chave publica do site)
//     TURNSTILE_SECRET_KEY             (chave secreta)
//
// Estas funcoes so LEEM as variaveis; nao guardam nem mostram nenhum valor.
// Usa-as apenas no servidor (paginas e server actions).
// =====================================================================================

// PLANOS ESCONDIDOS PARA LANCAMENTO - REATIVAR DEPOIS (mudar para true).
// Com false: o link "Planos" some do menu, a pagina /planos redireciona para o inicio
// e os botoes "Ver planos" ficam escondidos. Nada do codigo dos planos foi apagado.
export const PLANOS_VISIVEIS = false;

// O plano PRO esta ligado? (igual a PLANOS_VISIVEIS: e o interruptor unico dos planos)
export const isProEnabled = PLANOS_VISIVEIS;

// SkyWallet pronta? So se as 3 variaveis existirem. Sem elas: "Pagamentos em breve".
export function isSkyWalletConfigured(): boolean {
  return Boolean(
    process.env.SKYWALLET_SK_ID &&
      process.env.SKYWALLET_API_KEY &&
      process.env.SKYWALLET_WEBHOOK_SECRET,
  );
}

// Captcha pronto? So se a chave publica E a secreta existirem.
// Sem elas: os formularios funcionam sem captcha e o Admin mostra "Captcha desligado".
export function isCaptchaConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}
