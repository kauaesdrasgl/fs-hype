
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { demoProducts, formatBRL } from "@/lib/products";
import {
  CART_UPDATED_EVENT,
  readCart,
  writeCart,
  type CartLine,
} from "@/lib/cart";

export default function HomePage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("entrega");
  const [customerAddress, setCustomerAddress] = useState("");
  const [addressReference, setAddressReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
  const syncCart = () => setCart(readCart());

  syncCart();

  const url = new URL(window.location.href);

  if (url.searchParams.get("cart") === "open") {
    setCartOpen(true);

    url.searchParams.delete("cart");

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  window.addEventListener(CART_UPDATED_EVENT, syncCart);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, syncCart);
  };
}, []);

  const cartDetails = useMemo(() => {
    return cart.flatMap((line) => {
      const product = demoProducts.find((item) => item.id === line.productId);
      return product
        ? [{ product, quantity: line.quantity, size: line.size, color: line.color }]
        : [];
    });
  }, [cart]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);

  const subtotal = cartDetails.reduce(
    (total, line) => total + line.product.priceCents * line.quantity,
    0,
  );


  function changeQuantity(
    productId: string,
    delta: number,
    size?: string,
    color?: string,
  ) {
    const product = demoProducts.find((item) => item.id === productId);
    if (!product) return;

    const line = cart.find(
      (item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color,
    );

    if (!line) return;

    const stock = product.stockByVariant[`${size}|${color}`] ?? 0;
    const nextQuantity = line.quantity + delta;

    if (nextQuantity > Math.min(stock, 10)) return;

    const updatedCart =
      nextQuantity <= 0
        ? cart.filter(
          (item) =>
            !(
              item.productId === productId &&
              item.size === size &&
              item.color === color
            ),
        )
        : cart.map((item) =>
          item.productId === productId &&
            item.size === size &&
            item.color === color
            ? { ...item, quantity: nextQuantity }
            : item,
        );

    writeCart(updatedCart);
    setCart(updatedCart);
  }


  function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cartDetails.length === 0) return;

    const productsMessage = cartDetails
      .map(({ product, quantity, size, color }) =>
        [
          `• ${product.name}`,
          `  Tamanho: ${size || "Não informado"}`,
          `  Cor: ${color || "Não informada"}`,
          `  Quantidade: ${quantity}`,
          `  Valor unitário: ${formatBRL(product.priceCents)}`,
          `  Total: ${formatBRL(product.priceCents * quantity)}`,
        ].join("\n"),
      )
      .join("\n\n");

    const deliveryMessage =
      deliveryMethod === "entrega"
        ? `Entrega\nEndereço: ${customerAddress}\nReferência: ${addressReference || "Não informada"}\nTaxa de entrega: a combinar conforme a distância.`
        : "Retirada na loja";

    const message = [
      "Olá! Gostaria de realizar um pedido pela FStore.",
      "",
      "DADOS DO CLIENTE",
      `Nome: ${customerName}`,
      `Telefone: ${customerPhone}`,
      "",
      "PRODUTOS",
      productsMessage,
      "",
      "ENTREGA / RETIRADA",
      deliveryMessage,
      "",
      `Forma de pagamento: ${paymentMethod}`,
      "",
      `SUBTOTAL: ${formatBRL(subtotal)}`,
      "",
      "Aguardo a confirmação do pedido. Obrigado!",
    ].join("\n");

    const whatsappUrl = `https://wa.me/5568981094329?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="site-shell">
      <div className="announcement">FSTORE — SEU ESTILO, SUA IDENTIDADE</div>

      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="FStore — Página inicial">
            <img src="/images/fstore-logo.png" alt="FStore" className="brand-logo" />
          </Link>
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
            <div className="eyebrow">STREETWEAR • OVERSIZED • CASUAL</div>
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
          <div className="hero-art" role="img" aria-label="Arte gráfica conceitual da FStore">
            <div className="hero-art-shape" />
            <div className="hero-art-caption">
              <strong>FSTORE / STYLE & IDENTITY</strong>
              <span>STREETWEAR • OVERSIZED • CASUAL</span>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits" aria-label="Destaques da loja">
        <div className="container benefit-grid">
          <div className="benefit">✳ ESTILO PARA TODAS AS OCASIÕES</div>
          <div className="benefit">✳ VARIEDADE DE ESTILOS</div>
          <div className="benefit">✳ SUA IDENTIDADE, SEU JEITO</div>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">Encontre sua peça</div><h2>Explore por categoria</h2></div>
            <p>Uma base visual para organizar as coleções reais da loja quando o catálogo for fornecido.</p>
          </div>
          <div className="category-grid">
            <a className="category-card" href="#novidades"><span>01 / ESSENCIAIS</span><strong>Streetwear</strong></a>
            <a className="category-card" href="#novidades"><span>02 / CAMADAS</span><strong>Oversized</strong></a>
            <a className="category-card" href="#novidades"><span>03 / SILHUETAS</span><strong>Casual</strong></a>
          </div>
        </div>
      </section>

      <section className="section" id="novidades" style={{ paddingTop: 12 }}>
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">Seleção inicial</div><h2>Peças em destaque<span style={{ color: "#77736E" }}>.</span></h2></div>
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
              <p>FStore — moda urbana com atitude. Texto institucional provisório, sujeito à aprovação do cliente.</p>
            </div>
            <a className="button-primary" href="#novidades">CONHECER PEÇAS <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand" href="#"><img src="/images/fstore-logo.png" alt="FStore" className="brand-logo" /></a>
          <span>© {new Date().getFullYear()} FStore. Conteúdo demonstrativo para desenvolvimento.</span>
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
                <div
                  className="cart-line"
                  key={`${product.id}-${size}-${color}`}
                >
                  <div>
                    <strong>{product.name}</strong>
                    <small>
                      Tamanho: {size || "Não informado"} · Cor: {color || "Não informada"}
                    </small>
                    <small>{formatBRL(product.priceCents)} por unidade</small>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong>
                      {formatBRL(product.priceCents * quantity)}
                    </strong>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 7,
                      }}
                    >
                      <button
                        className="icon-button"
                        onClick={() =>
                          changeQuantity(product.id, -1, size, color)
                        }
                        aria-label={`Diminuir ${product.name}`}
                      >
                        −
                      </button>

                      <span>{quantity}</span>

                      <button
                        className="icon-button"
                        onClick={() =>
                          changeQuantity(product.id, 1, size, color)
                        }
                        aria-label={`Aumentar ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="cart-total">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>

              {!checkoutOpen ? (
                <button
                  type="button"
                  className="button-primary"
                  style={{ width: "100%", gap: 8 }}
                  onClick={() => setCheckoutOpen(true)}
                >
                  CONTINUAR PARA O PEDIDO <ArrowRight size={15} />
                </button>
              ) : (
                <form className="checkout-form" onSubmit={checkout}>
                  <div className="checkout-heading">
                    <h4>Finalizar pedido</h4>
                    <p>Informe seus dados para continuar pelo WhatsApp.</p>
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="customerName">Nome completo</label>
                    <input
                      id="customerName"
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Digite seu nome completo"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="customerPhone">Telefone / WhatsApp</label>
                    <input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="(68) 99999-9999"
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="deliveryMethod">Como deseja receber?</label>
                    <select
                      id="deliveryMethod"
                      value={deliveryMethod}
                      onChange={(event) => setDeliveryMethod(event.target.value)}
                    >
                      <option value="entrega">Entrega</option>
                      <option value="retirada">Retirada na loja</option>
                    </select>
                  </div>

                  {deliveryMethod === "entrega" && (
                    <>
                      <div className="checkout-field">
                        <label htmlFor="customerAddress">Endereço de entrega</label>
                        <input
                          id="customerAddress"
                          type="text"
                          value={customerAddress}
                          onChange={(event) => setCustomerAddress(event.target.value)}
                          placeholder="Rua, número, bairro e cidade"
                          autoComplete="street-address"
                          required
                        />
                      </div>

                      <div className="checkout-field">
                        <label htmlFor="addressReference">Referência do endereço</label>
                        <input
                          id="addressReference"
                          type="text"
                          value={addressReference}
                          onChange={(event) => setAddressReference(event.target.value)}
                          placeholder="Ex.: próximo à praça"
                        />
                      </div>

                      <p className="checkout-note">
                        A taxa de entrega será combinada diretamente com a loja, conforme a distância.
                      </p>
                    </>
                  )}

                  <div className="checkout-field">
                    <label htmlFor="paymentMethod">Forma de pagamento</label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de crédito">Cartão de crédito</option>
                      <option value="Cartão de débito">Cartão de débito</option>
                    </select>
                  </div>

                  <div className="checkout-summary">
                    <span>Subtotal dos produtos</span>
                    <strong>{formatBRL(subtotal)}</strong>
                  </div>

                  <button
                    type="submit"
                    className="button-primary"
                    style={{ width: "100%", gap: 8 }}
                  >
                    ENVIAR PEDIDO PELO WHATSAPP <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    className="checkout-back"
                    onClick={() => setCheckoutOpen(false)}
                  >
                    VOLTAR AO CARRINHO
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {toast && <div className="toast" role="status"><Check size={14} style={{ display: "inline", marginRight: 8 }} />{toast}</div>}
    </main>
  );
}
