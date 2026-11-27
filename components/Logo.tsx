import Image from "next/image";
import Link from "next/link";

// Logo EXATA da Imagem 1 (recortada, sem redesenhar, sem mudar cores, sem esticar):
// so se muda a altura e a largura acompanha a proporcao original (520x345).
export default function Logo({ altura = 64, prioridade = false }: { altura?: number; prioridade?: boolean }) {
  const largura = Math.round((altura * 520) / 345);
  return (
    <Link href="/" aria-label="ServiLink - Início" className="inline-flex items-center">
      <Image
        src="/logo.png"
        alt="ServiLink"
        width={largura}
        height={altura}
        priority={prioridade}
        style={{ width: "auto", height: altura }}
      />
    </Link>
  );
}
