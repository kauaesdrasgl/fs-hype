import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductsManager, { type AdminProduct, type ProductCategory } from "./products-manager";

export const metadata = { title: "Produtos | FStore Admin" };

export default async function ProductsPage() {
  const supabase = await createClient();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase.from("products")
      .select("id, name, slug, description, price, cost_price, sale_price, is_featured, status, created_at, category_id, categories(name), product_variants(id, stock_quantity, is_active)")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").eq("is_active", true).order("display_order").order("name"),
  ]);

  const safeProducts = (products ?? []) as unknown as AdminProduct[];
  const safeCategories = (categories ?? []) as ProductCategory[];

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <Link href="/admin" className="admin-dashboard-brand">FStore<span>.</span><small>ADMIN</small></Link>
        <Link href="/admin" className="admin-category-back"><ArrowLeft size={16} /> Painel</Link>
      </header>
      <section className="admin-dashboard-content admin-products-content">
        <p className="admin-dashboard-eyebrow">GESTÃO DO CATÁLOGO</p>
        <div className="admin-category-heading">
          <div>
            <span className="admin-category-heading-icon"><Package size={22} /></span>
            <div><h1>Produtos</h1><p className="admin-dashboard-welcome">Cadastre produtos, organize variações e acompanhe a disponibilidade no catálogo.</p></div>
          </div>
        </div>
        {error ? (
          <div className="admin-category-load-error" role="alert">
            <strong>Não foi possível carregar os produtos.</strong>
            <p>Verifique a estrutura da tabela products e as permissões de acesso.</p>
          </div>
        ) : (
          <ProductsManager products={safeProducts} categories={safeCategories} />
        )}
      </section>
    </main>
  );
}
