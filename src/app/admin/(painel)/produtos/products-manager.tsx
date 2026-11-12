"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X, ImagePlus } from "lucide-react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { attachProductImages, createProduct } from "./actions";

export type ProductCategory = { id: string; name: string };
export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  sale_price: number | null;
  is_featured: boolean;
  status: string;
  created_at: string;
  category_id: string | null;
  categories: { name: string } | null;
  product_variants: { id: string; stock_quantity: number; is_active: boolean }[];
};

type ColorDraft = { name: string; hex: string; sizes: string; images: File[] };
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES_PER_COLOR = 5;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function ProductsManager({ products, categories }: { products: AdminProduct[]; categories: ProductCategory[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [colors, setColors] = useState<ColorDraft[]>([{ name: "Preto", hex: "#090909", sizes: "P, M, G, GG", images: [] }]);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => !term || product.name.toLocaleLowerCase("pt-BR").includes(term) || product.slug.includes(term));
  }, [products, query]);

  const totalVariants = products.reduce((sum, product) => sum + product.product_variants.length, 0);
  const activeProducts = products.filter((product) => product.status === "published").length;

  function resetForm() {
    setName(""); setDescription(""); setCategoryId(""); setPrice(""); setCostPrice(""); setSalePrice("");
    setFeatured(false); setStatus("draft");
    setColors([{ name: "Preto", hex: "#090909", sizes: "P, M, G, GG", images: [] }]);
    setFeedback("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    const parsedColors = colors.map((color) => ({
      name: color.name,
      hex: color.hex,
      sizes: color.sizes.split(",").map((size) => size.trim()).filter(Boolean),
    }));

    const invalidImage = colors.some((color) => color.images.some((file) =>
      !IMAGE_TYPES[file.type] || file.size > MAX_IMAGE_SIZE
    ));
    if (invalidImage) {
      setFeedback("Use imagens JPG, PNG, WEBP ou AVIF com até 5 MB cada.");
      setFeedbackError(true);
      return;
    }

    startTransition(async () => {
      const result = await createProduct({
        name, description, category_id: categoryId || null,
        price: Number(price), cost_price: costPrice === "" ? null : Number(costPrice),
        sale_price: salePrice === "" ? null : Number(salePrice),
        is_featured: featured, status, colors: parsedColors,
      });

      if (!result.success) {
        setFeedback(result.message);
        setFeedbackError(true);
        return;
      }

      const selectedImages = colors.flatMap((color, colorIndex) =>
        color.images.map((file, imageIndex) => ({
          colorIndex,
          imageIndex,
          file,
          colorName: color.name,
        }))
      );

      if (selectedImages.length > 0) {
        const supabase = createBrowserSupabaseClient();
        const uploadedPaths: string[] = [];
        const imageRows: {
          color_id: string;
          storage_path: string;
          alt_text: string;
          display_order: number;
        }[] = [];

        try {
          for (const item of selectedImages) {
            const savedColor = result.colors[item.colorIndex];
            if (!savedColor) throw new Error("Não foi possível identificar a cor de uma das imagens.");

            const extension = IMAGE_TYPES[item.file.type];
            const path = `products/${result.productId}/${savedColor.id}/${crypto.randomUUID()}.${extension}`;
            const { error: uploadError } = await supabase.storage
              .from("product-images")
              .upload(path, item.file, {
                cacheControl: "3600",
                contentType: item.file.type,
                upsert: false,
              });

            if (uploadError) throw new Error(uploadError.message);
            uploadedPaths.push(path);
            imageRows.push({
              color_id: savedColor.id,
              storage_path: path,
              alt_text: `${name} - ${item.colorName}`,
              display_order: item.imageIndex,
            });
          }

          const attached = await attachProductImages({
            product_id: result.productId,
            images: imageRows,
          });
          if (!attached.success) throw new Error(attached.message);
        } catch (error) {
          if (uploadedPaths.length > 0) {
            await supabase.storage.from("product-images").remove(uploadedPaths);
          }
          setFeedback(`O produto foi cadastrado, mas as imagens não foram salvas: ${error instanceof Error ? error.message : "erro inesperado"}`);
          setFeedbackError(true);
          setModalOpen(false);
          resetForm();
          router.refresh();
          return;
        }
      }

      setFeedback(selectedImages.length > 0
        ? "Produto e imagens cadastrados com sucesso."
        : result.message);
      setFeedbackError(false);
      setModalOpen(false);
      resetForm();
      router.refresh();
    });
  }

  function updateColor(index: number, key: "name" | "hex" | "sizes", value: string) {
    setColors((current) => current.map((color, i) => i === index ? { ...color, [key]: value } : color));
  }

  function updateColorImages(index: number, files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (selected.length > MAX_IMAGES_PER_COLOR) {
      setFeedback(`Selecione no máximo ${MAX_IMAGES_PER_COLOR} imagens por cor.`);
      setFeedbackError(true);
      return;
    }
    const invalid = selected.find((file) => !IMAGE_TYPES[file.type] || file.size > MAX_IMAGE_SIZE);
    if (invalid) {
      setFeedback("Use imagens JPG, PNG, WEBP ou AVIF com até 5 MB cada.");
      setFeedbackError(true);
      return;
    }
    setFeedback("");
    setColors((current) => current.map((color, i) => i === index ? { ...color, images: selected } : color));
  }

  return (
    <section className="admin-products">
      <div className="admin-category-stats">
        <article><span>Produtos cadastrados</span><strong>{products.length}</strong></article>
        <article><span>Publicados</span><strong>{activeProducts}</strong></article>
        <article><span>Variações cadastradas</span><strong>{totalVariants}</strong></article>
      </div>
      <div className="admin-category-toolbar">
        <label className="admin-category-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto por nome..." aria-label="Buscar produtos" /></label>
        <button type="button" className="admin-category-primary" onClick={() => { resetForm(); setModalOpen(true); }}><Plus size={17} /> Novo produto</button>
      </div>
      {feedback && <p className={`admin-category-feedback ${feedbackError ? "is-error" : "is-success"}`} role="status">{feedback}</p>}
      <div className="admin-category-table-wrap">
        <table className="admin-category-table">
          <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Variações</th><th>Estoque</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((product) => {
              const stock = product.product_variants.reduce((sum, variant) => sum + (variant.is_active ? variant.stock_quantity : 0), 0);
              return <tr key={product.id}>
                <td><strong>{product.name}</strong><small>/{product.slug}{product.is_featured ? " · Destaque" : ""}</small></td>
                <td>{product.categories?.name ?? "Sem categoria"}</td>
                <td><strong>{money(product.sale_price ?? product.price)}</strong>{product.sale_price && <small>De {money(product.price)}</small>}</td>
                <td>{product.product_variants.length}</td>
                <td>{stock} un.</td>
                <td><span className={`admin-category-status ${product.status === "published" ? "active" : "inactive"}`}>{product.status === "published" ? "Publicado" : "Rascunho"}</span></td>
              </tr>;
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="admin-category-empty">{products.length ? "Nenhum produto corresponde à busca." : "Nenhum produto cadastrado. Comece adicionando o primeiro."}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="admin-category-footnote">As variações são criadas com estoque zero. As entradas de estoque serão registradas pelo módulo de movimentações, preservando o histórico e a auditoria.</p>

      {modalOpen && <div className="admin-category-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setModalOpen(false); }}>
        <section className="admin-category-modal admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <header><div><span>CATÁLOGO FSTORE</span><h2 id="product-modal-title">Cadastrar produto</h2></div><button type="button" onClick={() => setModalOpen(false)} disabled={pending} aria-label="Fechar"><X size={20} /></button></header>
          <form onSubmit={submit}>
            <div className="admin-product-form-grid">
              <label>Nome do produto<input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={120} required placeholder="Ex.: Camiseta Oversized FStore" /></label>
              <label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </div>
            <label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={5000} placeholder="Composição, modelagem, detalhes e cuidados..." /></label>
            <div className="admin-product-form-grid admin-product-prices">
              <label>Preço de venda (R$)<input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></label>
              <label>Preço de custo (R$)<input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} /></label>
              <label>Preço promocional (R$)<input type="number" min="0.01" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></label>
            </div>
            <section className="admin-product-colors">
              <div className="admin-product-section-heading"><div><strong>Cores, tamanhos e fotos</strong><small>As variações serão criadas automaticamente. As fotos ficam vinculadas à respectiva cor.</small></div><button type="button" className="admin-category-secondary" onClick={() => setColors((current) => [...current, { name: "", hex: "#000000", sizes: "P, M, G, GG", images: [] }])} disabled={colors.length >= 20}><Plus size={15} /> Adicionar cor</button></div>
              {colors.map((color, index) => <div className="admin-product-color-row" key={index}>
                <label>Cor<input value={color.name} onChange={(e) => updateColor(index, "name", e.target.value)} required maxLength={40} placeholder="Ex.: Preto" /></label>
                <label className="admin-product-hex">Identificação visual<input type="color" value={color.hex} onChange={(e) => updateColor(index, "hex", e.target.value)} /></label>
                <label className="admin-product-sizes">Tamanhos separados por vírgula<input value={color.sizes} onChange={(e) => updateColor(index, "sizes", e.target.value)} required placeholder="P, M, G, GG" /></label>
                {colors.length > 1 && <button type="button" className="admin-product-remove-color" onClick={() => setColors((current) => current.filter((_, i) => i !== index))} aria-label={`Remover cor ${color.name || index + 1}`}><X size={16} /></button>}
                <label className="admin-product-images">
                  <span><ImagePlus size={16} /> Fotos desta cor</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e) => updateColorImages(index, e.target.files)} />
                  <small>Até 5 imagens por cor · JPG, PNG, WEBP ou AVIF · máximo 5 MB por imagem</small>
                  {color.images.length > 0 && <small className="admin-product-image-list">{color.images.map((file) => file.name).join(" · ")}</small>}
                </label>
              </div>)}
            </section>
            <div className="admin-product-form-grid admin-product-options">
              <label className="admin-product-check"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Produto em destaque</label>
              <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label>
            </div>
            {feedback && <p className={`admin-category-feedback ${feedbackError ? "is-error" : "is-success"}`} role="alert">{feedback}</p>}
            <footer><button type="button" className="admin-category-secondary" onClick={() => setModalOpen(false)} disabled={pending}>Cancelar</button><button type="submit" className="admin-category-primary" disabled={pending}>{pending ? "Cadastrando produto e imagens..." : "Cadastrar produto"}</button></footer>
          </form>
        </section>
      </div>}
    </section>
  );
}
