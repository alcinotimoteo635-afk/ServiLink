import { MessageCircle } from "lucide-react";

// "Falar no WhatsApp". Depois de 1 clique no dia fica transparente e intocavel.
export default function BotaoWhatsapp({
  id, bloqueado = false, grande = false,
}: { id: string; bloqueado?: boolean; grande?: boolean }) {
  // Normal (cartoes): compacto no telemovel, tamanho de PC a partir de sm:
  const tamanho = grande ? "px-6 py-4 text-lg sm:w-auto w-full" : "px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-base";
  const base = `inline-flex items-center justify-center gap-1.5 rounded-lg bg-whats font-bold text-white sm:gap-2 sm:rounded-xl ${tamanho}`;
  const icone = <MessageCircle className={grande ? "h-6 w-6" : "h-4 w-4 shrink-0 sm:h-5 sm:w-5"} aria-hidden="true" />;
  if (bloqueado) {
    return (
      <span
        role="button"
        aria-disabled="true"
        title="Já contactaste este profissional hoje. Podes falar com ele outra vez amanhã."
        className={`${base} pointer-events-none cursor-not-allowed select-none opacity-30`}
      >
        {icone} Falar no WhatsApp
      </span>
    );
  }
  // Link normal (nao next/link) para o navegador nao pre-carregar e contar cliques sem querer.
  return (
    <a href={`/api/whatsapp/${id}`} rel="nofollow" className={`${base} hover:opacity-90`}>
      {icone} Falar no WhatsApp
    </a>
  );
}
