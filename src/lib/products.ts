export type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  compareAtCents?: number;
  label?: string;
  tone: "dark" | "light" | "purple" | "grey";
  description: string;
  sizes: string[];
  colors: string[];
  stockByVariant: Record<string, number>;
};

export const demoProducts: Product[] = [
  {
    id: "tee-core",
    name: "Camiseta Core Oversized",
    category: "Camisetas",
    priceCents: 8990,
    compareAtCents: 10990,
    label: "DESTAQUE",
    tone: "dark",
    description: "Modelagem oversized com estética urbana. Produto demonstrativo.",
    sizes: ["P", "M", "G", "GG"],
    colors: ["Preto"],
    stockByVariant: {"P|Preto": 5, "M|Preto": 5, "G|Preto": 5, "GG|Preto": 5},
  },
  {
    id: "hoodie-after",
    name: "Hoodie After Hours",
    category: "Moletons",
    priceCents: 16990,
    label: "NOVO",
    tone: "purple",
    description: "Moletom de visual marcante para compor looks urbanos. Produto demonstrativo.",
    sizes: ["M", "G", "GG"],
    colors: ["Roxo"],
    stockByVariant: {"M|Roxo": 5, "G|Roxo": 5, "GG|Roxo": 5},
  },
  {
    id: "tee-studio",
    name: "T-Shirt Studio White",
    category: "Camisetas",
    priceCents: 7990,
    tone: "light",
    description: "Camiseta clara de estilo minimalista. Produto demonstrativo.",
    sizes: ["P", "M", "G"],
    colors: ["Branco"],
    stockByVariant: {"P|Branco": 5, "M|Branco": 5, "G|Branco": 5},
  },
  {
    id: "cargo-shadow",
    name: "Calça Cargo Shadow",
    category: "Calças",
    priceCents: 18990,
    tone: "grey",
    description: "Calça cargo inspirada no streetwear contemporâneo. Produto demonstrativo.",
    sizes: ["38", "40", "42", "44"],
    colors: ["Cinza"],
    stockByVariant: {"38|Cinza": 5, "40|Cinza": 5, "42|Cinza": 5, "44|Cinza": 5},
  },
];

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function getProduct(id: string) { return demoProducts.find((product) => product.id === id); }
