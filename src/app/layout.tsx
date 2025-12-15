import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forja de Lendas | Criador de Monstros RPG",
  description: "Crie fichas de monstros, NPCs e vilões para D&D 5e com visual oficial.",
  icons: {
    // Se você tiver um favicon.ico na pasta public, ele usará.
    // Se quiser usar um emoji como ícone (truque rápido):
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐉</text></svg>",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}