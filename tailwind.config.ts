import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primaria: "#3B6CF0", // botoes (contraste AA com texto branco)
        marca: "#5B8CFF", // azul claro da logo ("Link")
        escuro: "#0F1B2D", // azul escuro quase preto da logo ("Servi")
        hero: "#F4F7FF",
        texto: "#0F1B2D",
        whats: "#128C4A",
        verificado: "#10B981",
        pro: "#FFB800",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
