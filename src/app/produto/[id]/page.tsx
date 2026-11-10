"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, ShoppingBag, Minus, Plus } from "lucide-react";
import { getProduct, formatBRL } from "@/lib/products";
import { readCart, writeCart } from "@/lib/cart";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  if (!product) {
    return (
      <main className="container product-page">
        <Link href="/">← Voltar à loja</Link>
        <h1>Produto não encontrado.</h1>
      </main>
    );
  }

  const available =
    size && color
      ? product.stockByVariant[`${size}|${color}`] ?? 0
      : 0;

  const canAdd = Boolean(size && color && available > 0);

  function add() {
    if (!product || !canAdd) return;

    const cart = readCart();

    const index = cart.findIndex(
      (line) =>
        line.productId === product.id &&
        line.size === size &&
        line.color === color,
    );

    const previous = index >= 0 ? cart[index].quantity : 0;
    const next = Math.min(available, 10, previous + quantity);

    if (next <= previous) {
      setNotice("Quantidade máxima disponível já está no carrinho.");
      return;
    }

    const updatedCart = [...cart];

    if (index >= 0) {
      updatedCart[index] = { ...updatedCart[index], quantity: next };
    } else {
      updatedCart.push({
        productId: product.id,
        size,
        color,
        quantity: next,
      });
    }

    writeCart(updatedCart);
    setNotice("Produto adicionado! Seu carrinho foi atualizado.");
  }

  return (
    <main className="site-shell">
      <div className="announcement">
        FSTORE — CATÁLOGO DEMONSTRATIVO
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <Link
            className="brand"
            href="/"
            aria-label="FStore — Página inicial"
          >
            <img
              src="/images/fstore-logo.png"
              alt="FStore"
              className="brand-logo"
            />
          </Link>

          <Link className="details-button back-link" href="/">
            <ArrowLeft size={15} />
            VOLTAR À LOJA
          </Link>
        </div>
      </header>

      <div className="container product-page">
        <nav className="product-breadcrumb">
          <Link href="/">Início</Link> / {product.category} / {product.name}
        </nav>

        <div className="product-detail-grid">
          <div
            className="product-detail-visual product-visual"
            data-tone={product.tone}
            aria-label="Imagem conceitual provisória do produto"
          >
            <span className="product-mark">F</span>
            <span className="visual-note">
              IMAGEM DEMONSTRATIVA — FOTOGRAFIA EM BREVE
            </span>
          </div>

          <section className="product-detail-info">
            <div className="eyebrow">
              {product.category} • FSTORE
            </div>

            <h1>{product.name}</h1>

            <div className="detail-prices">
              <strong>{formatBRL(product.priceCents)}</strong>
              {product.compareAtCents && (
                <del>{formatBRL(product.compareAtCents)}</del>
              )}
            </div>

            <p className="detail-description">{product.description}</p>

            <fieldset className="variant-field">
              <legend>
                Tamanho <span>*</span>
              </legend>

              <div className="variant-options">
                {product.sizes.map((item) => (
                  <button
                    type="button"
                    aria-pressed={size === item}
                    className={
                      size === item ? "variant selected" : "variant"
                    }
                    key={item}
                    onClick={() => {
                      setSize(item);
                      setQuantity(1);
                      setNotice("");
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="variant-field">
              <legend>
                Cor <span>*</span>
              </legend>

              <div className="variant-options">
                {product.colors.map((item) => (
                  <button
                    type="button"
                    aria-pressed={color === item}
                    className={
                      color === item ? "variant selected" : "variant"
                    }
                    key={item}
                    onClick={() => {
                      setColor(item);
                      setQuantity(1);
                      setNotice("");
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="stock-note">
              {size && color
                ? available > 0
                  ? `${available} unidades demonstrativas disponíveis nesta variação`
                  : "Variação indisponível"
                : "Selecione tamanho e cor para consultar a disponibilidade."}
            </p>

            <div className="purchase-row">
              <div className="quantity-control">
                <button
                  aria-label="Diminuir quantidade"
                  onClick={() =>
                    setQuantity((n) => Math.max(1, n - 1))
                  }
                >
                  <Minus size={16} />
                </button>

                <span>{quantity}</span>

                <button
                  aria-label="Aumentar quantidade"
                  onClick={() =>
                    setQuantity((n) =>
                      Math.min(10, available || 10, n + 1),
                    )
                  }
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                className="button-primary buy-button"
                disabled={!canAdd}
                onClick={add}
              >
                <ShoppingBag size={17} />
                ADICIONAR AO CARRINHO
              </button>
            </div>

            {notice && (
              <div className="detail-notice" role="status">
                <Check size={16} />
                {notice}
              </div>
            )}

            <p className="demo-disclaimer">
              Produto, preços e estoque fictícios, utilizados somente durante
              o desenvolvimento da loja.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
