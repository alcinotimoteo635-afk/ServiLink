import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ServiLink - Encontre o profissional ideal em Moçambique",
  description:
    "Serviços digitais e técnicos ao domicílio em Moçambique. Fale diretamente no WhatsApp com profissionais aprovados, sem comissão.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-MZ">
      <body className="flex min-h-screen flex-col bg-white font-sans text-base text-texto">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
