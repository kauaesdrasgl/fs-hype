import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CategoriesManager, { type Category } from "./categories-manager";

export const metadata = {
  title: "Categorias | FStore Admin",
};

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, is_active, display_order, created_at, updated_at")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const categories = (data ?? []) as Category[];

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <Link href="/admin" className="admin-dashboard-brand">FStore<span>.</span><small>ADMIN</small></Link>
        <Link href="/admin" className="admin-category-back"><ArrowLeft size={16} /> Painel</Link>
      </header>
      <section className="admin-dashboard-content admin-categories-content">
        <p className="admin-dashboard-eyebrow">GESTÃO DO CATÁLOGO</p>
        <div className="admin-category-heading">
          <div><span className="admin-category-heading-icon"><Tags size={22} /></span><div><h1>Categorias</h1><p className="admin-dashboard-welcome">Organize as categorias que estruturam o catálogo da FStore.</p></div></div>
        </div>
        {error ? (
          <div className="admin-category-load-error" role="alert">
            <strong>Não foi possível carregar as categorias.</strong>
            <p>Verifique a conexão com o Supabase e as permissões de acesso.</p>
          </div>
        ) : (
          <CategoriesManager categories={categories} />
        )}
      </section>
    </main>
  );
}
