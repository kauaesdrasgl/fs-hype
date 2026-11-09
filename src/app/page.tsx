"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { demoProducts, formatBRL, type Product } from "@/lib/products";

type CartLine = { productId: string; quantity: number; size?: string; color?: string };

const CART_KEY = "fs-hype-cart-v1";

export default function HomePage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
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
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (cartLoaded) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartLoaded]);

  const cartDetails = useMemo(() => {
    return cart.flatMap((line) => {
      const product = demoProducts.find((item) => item.id === line.productId);
      return product ? [{ product, quantity: line.quantity, size: line.size, color: line.color }] : [];
    });
  }, [cart]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartDetails.reduce(
    (total, line) => total + line.product.priceCents * line.quantity,
    0,
  );

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id && !line.size && !line.color);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id && !line.size && !line.color
            ? { ...line, quantity: Math.min(line.quantity + 1, 10) }
            : line,
        );
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
    setToast(`${product.name} adicionado ao carrinho`);
    window.setTimeout(() => setToast(""), 2600);
  }

  function changeQuantity(productId: string, delta: number, size?: string, color?: string) {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId && line.size === size && line.color === color
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
          <a className="brand" href="/" aria-label="FS HYPE — Página inicial">
            <img src="/images/fs-hype-logo.png" alt="FS HYPE" className="brand-logo"/>
          </a>
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
            <p>Uma base visual para organizar as coleções reais da loja quando o catálogo forfornecido.</p>
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
                    <a className="add-button" href={`/produto/${product.id}`}>ESCOLHER OPÇÕES</a>
                    <a className="details-button" href={`/produto/${product.id}`}>DETALHES</a>
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
              <p>FS HYPE — moda urbana com atitude. Texto institucional provisório, sujeito àaprovação do cliente.</p>
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
              {cartDetails.map(({ product, quantity, size, color }) => (
                <div className="cart-line" key={product.id}>
                  <div><strong>{product.name}</strong><small>{formatBRL(product.priceCents)} por unidade</small></div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{formatBRL(product.priceCents * quantity)}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                      <button className="icon-button" onClick={() => changeQuantity(product.id, -1, size, color)} aria-label={`Diminuir ${product.name}`}>−</button>
                      <span>{quantity}</span>
                      <button className="icon-button" onClick={() => changeQuantity(product.id, 1, size, color)} aria-label={`Aumentar ${product.name}`}>+</button>
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
