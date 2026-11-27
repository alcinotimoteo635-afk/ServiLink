import {
  Bug, Camera, Code2, Droplets, Film, GraduationCap, Headphones, Leaf, Megaphone,
  Paintbrush, Palette, Share2, Snowflake, Thermometer, Tv, Wrench, Zap, type LucideIcon,
} from "lucide-react";

const ICONES: Record<string, LucideIcon> = {
  "designer-grafico": Palette,
  "editor-de-video": Film,
  programador: Code2,
  "social-media": Share2,
  "fotografo-videografo": Camera,
  "explicador-online": GraduationCap,
  "assistente-virtual": Headphones,
  "marketing-digital": Megaphone,
  electricista: Zap,
  canalizador: Droplets,
  pintor: Paintbrush,
  "tecnico-de-ac": Snowflake,
  "tecnico-de-congeladores": Thermometer,
  exterminador: Bug,
  "mecanico-ao-domicilio": Wrench,
  "tecnico-de-tv-dstv": Tv,
  "jardineiro-limpeza": Leaf,
};

export default function IconeCategoria({ slug, className = "h-7 w-7" }: { slug: string; className?: string }) {
  const Icone = ICONES[slug] ?? Wrench;
  return <Icone className={className} aria-hidden="true" />;
}
