from pathlib import Path
import zipfile, textwrap, json, os

base = Path("/mnt/data/fs-hype")
files = {
"package.json": r'''
{
  "name": "fs-hype",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "15.5.6",
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "lucide-react": "^0.468.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "eslint": "^9.19.0",
    "eslint-config-next": "15.5.6",
    "typescript": "^5.7.3",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.5.3",
    "autoprefixer": "^10.4.20"
  }
}
''',
"tsconfig.json": r'''
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
''',
"next.config.ts": r'''
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "images", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
''',
"postcss.config.mjs": r'''
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
''',
"tailwind.config.ts": r'''
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        hype: {
          black: "#09090B",
          panel: "#141319",
          purple: "#9B5CFF",
          lilac: "#C8A7FF",
          muted: "#A6A2AE"
        }
      },
      boxShadow: {
        glow: "0 0 35px rgba(155, 92, 255, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
''',
".gitignore": r'''
node_modules/
.next/
out/
build/
dist/
.env
.env.local
.env.*.local
.vercel/
*.tsbuildinfo
next-env.d.ts
''',
".env.example": r'''
# Configure these values only when we implement the Supabase integration.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Store the official store WhatsApp number using country code and area code, digits only.
# Example format only: 55DDXXXXXXXXX
NEXT_PUBLIC_STORE_WHATSAPP=
''',
"src/app/layout.tsx": r'''
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
''',
"src/app/globals.css": r'''
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  --background: #09090b;
  --foreground: #f7f5fb;
  --purple: #9b5cff;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
button, input { font: inherit; }
button { cursor: pointer; }
::selection { background: rgba(155, 92, 255, .45); }

.site-shell { min-height: 100vh; overflow: hidden; }
.announcement {
  padding: 10px 18px;
  text-align: center;
  color: #e6d7ff;
  background: #201432;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
}
.container { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
.site-header {
  border-bottom: 1px solid rgba(255,255,255,.09);
  background: rgba(9,9,11,.92);
}
.header-inner {
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}
.brand { color: white; font-size: 27px; font-weight: 950; letter-spacing: -.08em; text-decoration: none; }
.brand span { color: var(--purple); }
.nav-links { display: flex; gap: 26px; align-items: center; }
.nav-links a { color: #c8c4cf; text-decoration: none; font-size: 13px; transition: color .2s; }
.nav-links a:hover { color: white; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.cart-button, .icon-button {
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  padding: 10px 15px;
  color: white;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.cart-count { display: inline-grid; place-items: center; min-width: 20px; height: 20px; border-radius: 50%; background: var(--purple); font-size: 10px; }
.hero { padding: 76px 0 72px; position: relative; }
.hero:before {
  content: "";
  position: absolute;
  width: 480px; height: 480px;
  top: -120px; right: -130px;
  background: radial-gradient(circle, rgba(132,75,219,.24), transparent 68%);
  pointer-events: none;
}
.hero-grid { display: grid; grid-template-columns: 1.05fr .95fr; align-items: center; gap: 44px; position: relative; }
.eyebrow { color: #c9a9ff; font-size: 11px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.hero h1 { font-size: clamp(48px, 6.4vw, 82px); line-height: .93; letter-spacing: -.075em; margin: 22px 0; max-width: 650px; }
.hero h1 em { color: var(--purple); font-style: normal; }
.hero-copy { color: #aaa5b4; max-width: 430px; line-height: 1.8; font-size: 15px; }
.hero-buttons { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.button-primary, .button-secondary {
  min-height: 48px; padding: 0 20px; border-radius: 5px; display: inline-flex;
  align-items: center; justify-content: center; text-decoration: none; font-weight: 800; font-size: 12px;
  transition: transform .2s, background .2s;
}
.button-primary { color: #10091b; background: #c8a7ff; border: 1px solid #c8a7ff; }
.button-primary:hover { transform: translateY(-2px); background: white; }
.button-secondary { color: white; background: transparent; border: 1px solid #45414d; }
.button-secondary:hover { transform: translateY(-2px); border-color: #c8a7ff; }
.hero-art {
  min-height: 400px; border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
  position: relative; overflow: hidden; display: flex; align-items: end; padding: 25px;
  background:
    radial-gradient(ellipse at 70% 20%, rgba(172,117,255,.65), transparent 34%),
    radial-gradient(ellipse at 25% 90%, rgba(86,41,145,.5), transparent 38%),
    linear-gradient(135deg, #29202f, #111014 62%, #1b1426);
}
.hero-art:before {
  content: "HYPE"; position: absolute; right: -18px; top: 38px; transform: rotate(90deg);
  transform-origin: right top; font-size: clamp(68px, 10vw, 130px); font-weight: 950; letter-spacing: -.1em;
  color: rgba(255,255,255,.06);
}
.hero-art-shape {
  position: absolute; width: 210px; height: 300px; left: 50%; top: 45%; transform: translate(-50%,-50%) rotate(-8deg);
  border-radius: 48px 48px 20px 20px;
  background: linear-gradient(140deg, #3c3445, #17151a 55%, #32213f);
  border: 1px solid rgba(255,255,255,.18);
  box-shadow: 25px 30px 60px rgba(0,0,0,.45), inset 0 0 30px rgba(255,255,255,.04);
}
.hero-art-shape:before {
  content: "FS"; position: absolute; top: 105px; left: 0; right: 0; text-align: center;
  font-size: 68px; font-weight: 950; letter-spacing: -.1em; color: #c8a7ff;
}
.hero-art-shape:after {
  content: "STREET DIVISION"; position: absolute; top: 185px; left: 0; right: 0;
  text-align: center; font-size: 8px; letter-spacing: .2em; color: #c8a7ff;
}
.hero-art-caption { position: relative; z-index: 1; display: flex; justify-content: space-between; width: 100%; align-items: end; gap: 10px; }
.hero-art-caption strong { font-size: 12px; letter-spacing: .12em; }
.hero-art-caption span { color: #b5aebf; font-size: 10px; }
.benefits { border-top: 1px solid rgba(255,255,255,.08); border-bottom: 1px solid rgba(255,255,255,.08); }
.benefit-grid { display: grid; grid-template-columns: repeat(3,1fr); }
.benefit { padding: 21px 20px; text-align: center; color: #bdb8c6; font-size: 11px; letter-spacing: .06em; border-right: 1px solid rgba(255,255,255,.08); }
.benefit:last-child { border-right: 0; }
.section { padding: 76px 0; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.section-heading h2 { margin: 9px 0 0; font-size: clamp(29px,4vw,42px); letter-spacing: -.06em; }
.section-heading p { color: #a6a2ae; font-size: 13px; line-height: 1.7; max-width: 350px; margin: 0; }
.category-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.category-card { min-height: 180px; border: 1px solid #29262f; border-radius: 7px; padding: 23px; text-decoration: none; color: white; display: flex; flex-direction: column; justify-content: end; position: relative; overflow: hidden; background: linear-gradient(135deg,#29202f,#121115); }
.category-card:nth-child(2) { background: linear-gradient(135deg,#1c1c26,#322044); }
.category-card:nth-child(3) { background: linear-gradient(135deg,#30243a,#151319); }
.category-card:before { content: ""; position: absolute; width: 140px; height: 140px; right: -25px; top: -35px; border: 1px solid rgba(200,167,255,.3); border-radius: 50%; box-shadow: 0 0 0 18px rgba(200,167,255,.03), 0 0 0 38px rgba(200,167,255,.025); }
.category-card span { position: relative; color: #c8a7ff; font-size: 10px; letter-spacing: .18em; font-weight: 800; }
.category-card strong { position: relative; margin-top: 9px; font-size: 24px; letter-spacing: -.04em; }
.product-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; }
.product-card { border: 1px solid #27242d; border-radius: 7px; overflow: hidden; background: #111014; }
.product-visual { min-height: 245px; position: relative; display: grid; place-items: center; overflow: hidden; background: linear-gradient(145deg,#24202a,#111014 65%); }
.product-visual:before { content: ""; position: absolute; width: 135px; height: 175px; border-radius: 25px 25px 9px 9px; background: linear-gradient(145deg,#39323f,#17151a); border: 1px solid rgba(255,255,255,.13); transform: rotate(-5deg); box-shadow: 18px 20px 35px rgba(0,0,0,.3); }
.product-visual[data-tone="light"]:before { background: linear-gradient(145deg,#e9e4ed,#aaa2b5); }
.product-visual[data-tone="purple"]:before { background: linear-gradient(145deg,#8e59bd,#392347); }
.product-visual[data-tone="grey"]:before { background: linear-gradient(145deg,#77717e,#302d35); }
.product-mark { position: relative; z-index: 1; color: #d6bbff; font-weight: 950; font-size: 35px; letter-spacing: -.12em; transform: rotate(-5deg); }
.product-label { position: absolute; top: 12px; left: 12px; z-index: 2; padding: 6px 8px; background: #c8a7ff; color: #160d22; border-radius: 3px; font-size: 9px; font-weight: 900; letter-spacing: .08em; }
.product-info { padding: 15px; }
.product-category { color: #9f96ad; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
.product-name { font-size: 14px; margin: 7px 0 11px; }
.product-price { display: flex; align-items: baseline; gap: 8px; }
.product-price strong { font-size: 15px; }
.product-price del { color: #77717f; font-size: 11px; }
.product-actions { display: flex; gap: 8px; margin-top: 14px; }
.product-actions button { flex: 1; min-height: 37px; border-radius: 4px; font-size: 10px; font-weight: 800; }
.add-button { background: #c8a7ff; border: 1px solid #c8a7ff; color: #160d22; }
.details-button { color: white; background: transparent; border: 1px solid #403a48; }
.promo { background: linear-gradient(105deg,#241632,#111014 70%); border: 1px solid #3a294c; border-radius: 8px; padding: 36px; display: flex; justify-content: space-between; align-items: center; gap: 25px; }
.promo h2 { margin: 10px 0; font-size: clamp(26px,4vw,40px); letter-spacing: -.06em; }
.promo p { margin: 0; color: #b5aebf; font-size: 13px; line-height: 1.7; }
.footer { border-top: 1px solid #25222a; padding: 35px 0; color: #9b96a3; font-size: 11px; }
.footer-inner { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.footer a { color: #c8a7ff; text-decoration: none; }
.toast { position: fixed; right: 20px; bottom: 20px; z-index: 20; border: 1px solid #60458a; background: #21152e; color: white; border-radius: 6px; padding: 13px 17px; box-shadow: 0 15px 40px rgba(0,0,0,.4); font-size: 12px; }
.cart-panel { position: fixed; right: 18px; top: 18px; z-index: 30; width: min(390px, calc(100vw - 36px)); max-height: calc(100vh - 36px); overflow: auto; background: #141319; border: 1px solid #44374f; border-radius: 10px; box-shadow: 0 25px 90px rgba(0,0,0,.65); padding: 20px; }
.cart-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.cart-panel h3 { margin: 0; font-size: 20px; }
.cart-line { display: flex; justify-content: space-between; gap: 12px; padding: 13px 0; border-bottom: 1px solid #2d2933; font-size: 12px; }
.cart-line small { display: block; color: #a6a2ae; margin-top: 5px; }
.cart-total { display: flex; justify-content: space-between; padding: 20px 0; font-weight: 800; }
.empty-cart { color: #aaa5b4; font-size: 13px; line-height: 1.7; padding: 18px 0; }
@media (max-width: 850px) {
  .nav-links { display: none; }
  .hero-grid { grid-template-columns: 1fr; }
  .hero { padding-top: 54px; }
  .hero-art { min-height: 330px; }
  .product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .product-visual { min-height: 220px; }
}
@media (max-width: 560px) {
  .container { width: min(100% - 28px, 1180px); }
  .header-inner { min-height: 68px; }
  .brand { font-size: 24px; }
  .cart-button { padding: 9px 11px; }
  .hero h1 { font-size: clamp(44px, 14vw, 68px); }
  .hero-art { min-height: 285px; }
  .hero-art-shape { transform: translate(-50%,-50%) scale(.8) rotate(-8deg); }
  .benefit-grid { grid-template-columns: 1fr; }
  .benefit { border-right: 0; border-bottom: 1px solid rgba(255,255,255,.08); padding: 15px; }
  .benefit:last-child { border-bottom: 0; }
  .section { padding: 54px 0; }
  .section-heading { align-items: start; flex-direction: column; }
  .category-grid { grid-template-columns: 1fr; }
  .category-card { min-height: 140px; }
  .product-grid { gap: 10px; }
  .product-visual { min-height: 180px; }
  .product-visual:before { transform: scale(.8) rotate(-5deg); }
  .product-mark { font-size: 28px; }
  .product-info { padding: 11px; }
  .product-name { min-height: 32px; line-height: 1.35; }
  .product-actions { flex-direction: column; }
  .promo { padding: 25px; align-items: start; flex-direction: column; }
  .footer-inner { align-items: start; flex-direction: column; }
}
''',
"src/lib/products.ts": r'''
export type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  compareAtCents?: number;
  label?: string;
  tone: "dark" | "light" | "purple" | "grey";
  description: string;
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
  },
  {
    id: "hoodie-after",
    name: "Hoodie After Hours",
    category: "Moletons",
    priceCents: 16990,
    label: "NOVO",
    tone: "purple",
    description: "Moletom de visual marcante para compor looks urbanos. Produto demonstrativo.",
  },
  {
    id: "tee-studio",
    name: "T-Shirt Studio White",
    category: "Camisetas",
    priceCents: 7990,
    tone: "light",
    description: "Camiseta clara de estilo minimalista. Produto demonstrativo.",
  },
  {
    id: "cargo-shadow",
    name: "Calça Cargo Shadow",
    category: "Calças",
    priceCents: 18990,
    tone: "grey",
    description: "Calça cargo inspirada no streetwear contemporâneo. Produto demonstrativo.",
  },
];

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
''',
"src/app/page.tsx": r'''
"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { demoProducts, formatBRL, type Product } from "@/lib/products";

type CartLine = { productId: string; quantity: number };

const CART_KEY = "fs-hype-cart-v1";

export default function HomePage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed as CartLine[]);
      }
    } catch {
      window.localStorage.removeItem(CART_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartDetails = useMemo(() => {
    return cart.flatMap((line) => {
      const product = demoProducts.find((item) => item.id === line.productId);
      return product ? [{ product, quantity: line.quantity }] : [];
    });
  }, [cart]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartDetails.reduce(
    (total, line) => total + line.product.priceCents * line.quantity,
    0,
  );

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Math.min(line.quantity + 1, 10) }
            : line,
        );
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
    setToast(`${product.name} adicionado ao carrinho`);
    window.setTimeout(() => setToast(""), 2600);
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function checkout() {
    setToast("O WhatsApp comercial será configurado na próxima etapa.");
  }

  return (
    <main className="site-shell">
      <div className="announcement">ESTILO É ATITUDE — BEM-VINDO À FS HYPE</div>

      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#" aria-label="FS HYPE início">FS<span>.</span>HYPE</a>
          <nav className="nav-links" aria-label="Navegação principal">
            <a href="#novidades">Novidades</a>
            <a href="#categorias">Categorias</a>
            <a href="#sobre">A marca</a>
          </nav>
          <div className="header-actions">
            <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Abrir carrinho, ${cartCount} itens`}>
              <ShoppingBag size={15} /> CARRINHO <span className="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Streetwear • Drop demonstrativo</div>
            <h1>Vista sua<br /><em>própria</em> atitude.</h1>
            <p className="hero-copy">
              Peças com presença. Uma identidade feita para quem não precisa seguir o padrão
              para se destacar.
            </p>
            <div className="hero-buttons">
              <a className="button-primary" href="#novidades">EXPLORAR COLEÇÃO <ArrowRight size={15} /></a>
              <a className="button-secondary" href="#categorias">VER CATEGORIAS <ArrowDownRight size={15} /></a>
            </div>
          </div>
          <div className="hero-art" role="img" aria-label="Arte gráfica conceitual da FS HYPE">
            <div className="hero-art-shape" />
            <div className="hero-art-caption">
              <strong>FS HYPE / STREET DIVISION</strong>
              <span>DROP 001 — CONCEPT</span>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits" aria-label="Destaques da loja">
        <div className="container benefit-grid">
          <div className="benefit">✳ CURADORIA STREETWEAR</div>
          <div className="benefit">✳ COMPRA SIMPLES PELO WHATSAPP</div>
          <div className="benefit">✳ ESTILO SEM FÓRMULA</div>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">Encontre sua peça</div><h2>Explore por categoria</h2></div>
            <p>Uma base visual para organizar as coleções reais da loja quando o catálogo for fornecido.</p>
          </div>
          <div className="category-grid">
            <a className="category-card" href="#novidades"><span>01 / ESSENCIAIS</span><strong>Camisetas</strong></a>
            <a className="category-card" href="#novidades"><span>02 / CAMADAS</span><strong>Moletons</strong></a>
            <a className="category-card" href="#novidades"><span>03 / SILHUETAS</span><strong>Calças & cargos</strong></a>
          </div>
        </div>
      </section>

      <section className="section" id="novidades" style={{ paddingTop: 12 }}>
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">Seleção inicial</div><h2>Peças em destaque<span style={{ color: "#9B5CFF" }}>.</span></h2></div>
            <p>Os itens e preços abaixo são demonstrativos. Serão substituídos pelo catálogo real do cliente.</p>
          </div>
          <div className="product-grid">
            {demoProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-visual" data-tone={product.tone}>
                  {product.label && <span className="product-label">{product.label}</span>}
                  <span className="product-mark">FS</span>
                </div>
                <div className="product-info">
                  <div className="product-category">{product.category}</div>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">
                    <strong>{formatBRL(product.priceCents)}</strong>
                    {product.compareAtCents && <del>{formatBRL(product.compareAtCents)}</del>}
                  </div>
                  <div className="product-actions">
                    <button className="add-button" onClick={() => addToCart(product)}>ADICIONAR AO CARRINHO</button>
                    <button className="details-button" onClick={() => { setToast(product.description); window.setTimeout(() => setToast(""), 3200); }}>DETALHES</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="sobre">
        <div className="container">
          <div className="promo">
            <div>
              <div className="eyebrow">Sua identidade. Suas regras.</div>
              <h2>Não vista o comum.</h2>
              <p>FS HYPE — moda urbana com atitude. Texto institucional provisório, sujeito à aprovação do cliente.</p>
            </div>
            <a className="button-primary" href="#novidades">CONHECER PEÇAS <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand" href="#">FS<span>.</span>HYPE</a>
          <span>© {new Date().getFullYear()} FS HYPE. Conteúdo demonstrativo para desenvolvimento.</span>
          <a href="#sobre">Sobre a marca</a>
        </div>
      </footer>

      {cartOpen && (
        <div className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <div className="cart-panel-head">
            <h3 id="cart-title">Seu carrinho ({cartCount})</h3>
            <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><X size={16} /></button>
          </div>
          {cartDetails.length === 0 ? (
            <p className="empty-cart">Seu carrinho ainda está vazio. Explore a seleção e adicione suas peças favoritas.</p>
          ) : (
            <>
              {cartDetails.map(({ product, quantity }) => (
                <div className="cart-line" key={product.id}>
                  <div><strong>{product.name}</strong><small>{formatBRL(product.priceCents)} por unidade</small></div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{formatBRL(product.priceCents * quantity)}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                      <button className="icon-button" onClick={() => changeQuantity(product.id, -1)} aria-label={`Diminuir ${product.name}`}>−</button>
                      <span>{quantity}</span>
                      <button className="icon-button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Aumentar ${product.name}`}>+</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="cart-total"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
              <button className="button-primary" style={{ width: "100%", gap: 8 }} onClick={checkout}>CONTINUAR PARA O PEDIDO <ArrowRight size={15} /></button>
              <p className="empty-cart">O fluxo de pedido pelo WhatsApp será conectado após recebermos o número oficial e as regras comerciais da loja.</p>
            </>
          )}
        </div>
      )}

      {toast && <div className="toast" role="status"><Check size={14} style={{ display: "inline", marginRight: 8 }} />{toast}</div>}
    </main>
  );
}
''',
"README.md": r'''
# FS HYPE — Loja virtual

Primeira base visual do e-commerce FS HYPE, criada com Next.js, React, TypeScript e Tailwind CSS.

## Estado atual

Esta é a primeira etapa de implementação: uma interface inicial responsiva, com categorias demonstrativas, cards de produtos e carrinho local salvo no navegador.

**Ainda não é uma loja pronta para produção.** Os produtos, preços, imagens gráficas e textos são demonstrativos. O checkout do WhatsApp, banco de dados, autenticação e painel administrativo ainda precisam ser implementados.

## Requisitos

- Node.js 20.9 ou superior (o ambiente informado anteriormente tem Node.js 24.16.0)
- npm

## Executar localmente

1. Extraia a pasta `fs-hype` para `C:\Users\Folha do Acre\Documents\FS HYPE` ou para outro diretório.
2. Abra a pasta no VS Code.
3. Abra o terminal integrado e execute:

```bash
npm install
npm run dev
```

4. Acesse `http://localhost:3000`.

Para validar a compilação:

```bash
npm run build
```

## Próximas etapas

1. Executar a aplicação e corrigir eventuais incompatibilidades do ambiente.
2. Ajustar a identidade visual com os materiais oficiais do cliente.
3. Receber catálogo, fotos, preços, variações e estoque reais.
4. Configurar Supabase, migrações e políticas de acesso.
5. Implementar autenticação e painel administrativo.
6. Implementar pedidos pelo WhatsApp e validação de valores no servidor.
7. Executar testes e preparar a publicação.

## Variáveis de ambiente

O arquivo `.env.example` documenta variáveis previstas para a integração futura. Não coloque segredos no código-fonte nem compartilhe arquivos `.env` com credenciais.
''',
"eslint.config.mjs": r'''
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
''',
}

# Ensure paths and write source files
for rel, content in files.items():
    path = base / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip(), encoding="utf-8")

# Add a human-readable implementation status document
status = """# Registro de implementação — FS HYPE

## Etapa executada
- Criada a base inicial do frontend Next.js.
- Definida identidade provisória escura com roxo, preto e branco.
- Criada home responsiva com navegação, categorias e produtos demonstrativos.
- Criado carrinho local com persistência em localStorage, alteração de quantidades e subtotal.
- Incluído README com instruções para instalação e estado atual.
- Incluído `.env.example` sem credenciais.

## Ainda não implementado
- Integração Supabase e banco de dados.
- Autenticação administrativa e painel.
- Catálogo real, fotos reais e regras de estoque.
- Checkout efetivo pelo WhatsApp.
- Testes de execução/build no computador do usuário.
- Publicação.

## Observação
O código foi preparado em um ambiente de geração de arquivos. Não foi executado `npm install`, `npm run dev` nem `npm run build`; portanto, a aplicação ainda precisa ser instalada e validada no ambiente de desenvolvimento.
"""
(base / "IMPLEMENTACAO.md").write_text(status, encoding="utf-8")

zip_path = Path("/mnt/data/FS-HYPE-inicial.zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for p in base.rglob("*"):
        if p.is_file():
            zf.write(p, Path("fs-hype") / p.relative_to(base))

print(f"Projeto criado com {len(files)+1} arquivos de texto.")
print(f"Arquivo compactado: {zip_path}")
