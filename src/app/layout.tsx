import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FStore | Streetwear, Oversized e Casual",
  description:
    "Descubra a FStore: moda streetwear, oversized e casual. Encontre peças que combinam com seu estilo e sua identidade.",
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
