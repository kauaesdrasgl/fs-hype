"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, ShoppingBag, Minus, Plus } from "lucide-react";
import { getProduct, formatBRL } from "@/lib/products";

type CartLine = { productId: string; quantity: number; size?: string; color?: string };
const CART_KEY = "fs-hype-cart-v1";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  if (!product) return <main className="container product-page"><Link href="/">← Voltar à loja</Link><h1>Produto não encontrado.</h1></main>;
  const available = size && color ? (product.stockByVariant[`${size}|${color}`] ?? 0) : 0;
  const canAdd = Boolean(size && color && available > 0);

  function add() {
    if (!product || !canAdd) return;
    let cart: CartLine[] = [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
      if (Array.isArray(parsed)) cart = parsed.filter((line): line is CartLine => typeof line === "object" && line !== null && typeof line.productId === "string" && typeof line.quantity === "number");
    } catch { cart = []; }
    const index = cart.findIndex((line) => line.productId === product.id && line.size === size && line.color === color);
    const previous = index >= 0 ? cart[index].quantity : 0;
    const next = Math.min(available, 10, previous + quantity);
    if (next <= previous) { setNotice("Quantidade máxima disponível já está no carrinho."); return; }
    if (index >= 0) cart[index] = { ...cart[index], quantity: next };
    else cart.push({ productId: product.id, size, color, quantity: next });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    setNotice("Produto adicionado! Volte à loja para visualizar o carrinho.");
  }

  return (
    <main className="site-shell">
      <div className="announcement">FS HYPE — CATÁLOGO DEMONSTRATIVO</div>
      <header className="site-header"><div className="container header-inner"><Link className="brand" href="/">FS<span>.</span>HYPE</Link><Link className="details-button back-link" href="/"><ArrowLeft size={15}/> VOLTAR À LOJA</Link></div></header>
      <div className="container product-page">
        <nav className="product-breadcrumb"><Link href="/">Início</Link> / {product.category} / {product.name}</nav>
        <div className="product-detail-grid">
          <div className="product-detail-visual product-visual" data-tone={product.tone} aria-label="Imagem conceitual provisória do produto"><span className="product-mark">FS</span><span className="visual-note">IMAGEM DEMONSTRATIVA — FOTOGRAFIA EM BREVE</span></div>
          <section className="product-detail-info">
            <div className="eyebrow">{product.category} • FS HYPE</div>
            <h1>{product.name}</h1>
            <div className="detail-prices"><strong>{formatBRL(product.priceCents)}</strong>{product.compareAtCents && <del>{formatBRL(product.compareAtCents)}</del>}</div>
            <p className="detail-description">{product.description}</p>
            <fieldset className="variant-field"><legend>Tamanho <span>*</span></legend><div className="variant-options">{product.sizes.map((item) => <button type="button" aria-pressed={size === item} className={size === item ? "variant selected" : "variant"} key={item} onClick={() => {setSize(item);setQuantity(1);setNotice("");}}>{item}</button>)}</div></fieldset>
            <fieldset className="variant-field"><legend>Cor <span>*</span></legend><div className="variant-options">{product.colors.map((item) => <button type="button" aria-pressed={color === item} className={color === item ? "variant selected" : "variant"} key={item} onClick={() => {setColor(item);setQuantity(1);setNotice("");}}>{item}</button>)}</div></fieldset>
            <p className="stock-note">{size && color ? (available > 0 ? `${available} unidades demonstrativas disponíveis nesta variação` : "Variação indisponível") : "Selecione tamanho e cor para consultar a disponibilidade."}</p>
            <div className="purchase-row"><div className="quantity-control"><button aria-label="Diminuir quantidade" onClick={() => setQuantity((n) => Math.max(1, n - 1))}><Minus size={16}/></button><span>{quantity}</span><button aria-label="Aumentar quantidade" onClick={() => setQuantity((n) => Math.min(10, available || 10, n + 1))}><Plus size={16}/></button></div><button className="button-primary buy-button" disabled={!canAdd} onClick={add}><ShoppingBag size={17}/> ADICIONAR AO CARRINHO</button></div>
            {notice && <div className="detail-notice" role="status"><Check size={16}/>{notice}</div>}
            <p className="demo-disclaimer">Produto, preços e estoque fictícios, utilizados somente durante o desenvolvimento da loja.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
