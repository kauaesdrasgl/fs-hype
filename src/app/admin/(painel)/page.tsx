import Link from "next/link";
import LogoutButton from "./logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const displayName =
    profile?.full_name || user?.email || "Administrador";

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <Link href="/" className="admin-dashboard-brand">
          FStore<span>.</span>
          <small>ADMIN</small>
        </Link>
        <LogoutButton />
      </header>

      <section className="admin-dashboard-content">
        <p className="admin-dashboard-eyebrow">
          CENTRAL DE GESTÃO
        </p>
        <h1>Painel administrativo</h1>
        <p className="admin-dashboard-welcome">
          Bem-vindo, {displayName}.
        </p>

        <div className="admin-dashboard-grid">
          <article className="admin-dashboard-card">
            <span>01</span>
            <h2>Produtos</h2>
            <p>Cadastro, edição, fotos, cores e tamanhos.</p>
            <small>Próxima etapa</small>
          </article>

          <article className="admin-dashboard-card">
            <span>02</span>
            <h2>Estoque</h2>
            <p>Controle unificado de produtos e variantes.</p>
            <small>Em planejamento</small>
          </article>

          <article className="admin-dashboard-card">
            <span>03</span>
            <h2>Pedidos</h2>
            <p>Acompanhamento de vendas e cancelamentos.</p>
            <small>Em planejamento</small>
          </article>

          <article className="admin-dashboard-card">
            <span>04</span>
            <h2>Ponto de venda</h2>
            <p>Registro de vendas realizadas na loja física.</p>
            <small>Em planejamento</small>
          </article>
        </div>
      </section>
    </main>
  );
}
