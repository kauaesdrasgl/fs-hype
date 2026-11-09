import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FS HYPE — Streetwear para quem tem identidade",
  description:
    "Explore a seleção FS HYPE: streetwear, peças marcantes e estilo sem pedir licença.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
