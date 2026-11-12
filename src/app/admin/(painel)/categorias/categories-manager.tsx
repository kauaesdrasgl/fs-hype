"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, X, Power } from "lucide-react";
import { saveCategory, setCategoryActive } from "./actions";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type Props = { categories: Category[] };

export default function CategoriesManager({ categories }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("0");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return [...categories]
      .filter((item) => !term || item.name.toLocaleLowerCase("pt-BR").includes(term) || item.slug.includes(term))
      .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name, "pt-BR"));
  }, [categories, query]);

  function openNew() {
    setEditing(null);
    setName("");
    setDescription("");
    setOrder("0");
    setFeedback("");
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setOrder(String(category.display_order));
    setFeedback("");
    setModalOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    startTransition(async () => {
      const result = await saveCategory({
        id: editing?.id ?? "",
        name,
        description,
        display_order: Number(order),
      });
      setFeedback(result.message);
      setFeedbackError(!result.success);
      if (result.success) {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  function toggleActive(category: Category) {
    const action = category.is_active ? "desativar" : "ativar";
    if (!window.confirm(`Deseja realmente ${action} a categoria "${category.name}"?`)) return;
    setFeedback("");
    startTransition(async () => {
      const result = await setCategoryActive(category.id, !category.is_active);
      setFeedback(result.message);
      setFeedbackError(!result.success);
      if (result.success) router.refresh();
    });
  }

  const activeCount = categories.filter((item) => item.is_active).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <section className="admin-categories">
      <div className="admin-category-stats">
        <article><span>Total de categorias</span><strong>{categories.length}</strong></article>
        <article><span>Ativas</span><strong>{activeCount}</strong></article>
        <article><span>Inativas</span><strong>{inactiveCount}</strong></article>
      </div>

      <div className="admin-category-toolbar">
        <label className="admin-category-search">
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou endereço..." aria-label="Buscar categorias" />
        </label>
        <button type="button" className="admin-category-primary" onClick={openNew}>
          <Plus size={17} /> Nova categoria
        </button>
      </div>

      {feedback && <p className={`admin-category-feedback ${feedbackError ? "is-error" : "is-success"}`} role="status">{feedback}</p>}

      <div className="admin-category-table-wrap">
        <table className="admin-category-table">
          <thead><tr><th>Categoria</th><th>Endereço</th><th>Ordem</th><th>Status</th><th className="actions-heading">Ações</th></tr></thead>
          <tbody>
            {filtered.map((category) => (
              <tr key={category.id}>
                <td><strong>{category.name}</strong>{category.description && <small>{category.description}</small>}</td>
                <td><code>/{category.slug}</code></td>
                <td>{category.display_order}</td>
                <td><span className={`admin-category-status ${category.is_active ? "active" : "inactive"}`}>{category.is_active ? "Ativa" : "Inativa"}</span></td>
                <td className="admin-category-actions">
                  <button type="button" onClick={() => openEdit(category)} aria-label={`Editar ${category.name}`} title="Editar"><Pencil size={16} /></button>
                  <button type="button" onClick={() => toggleActive(category)} disabled={isPending} aria-label={`${category.is_active ? "Desativar" : "Ativar"} ${category.name}`} title={category.is_active ? "Desativar" : "Ativar"}><Power size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="admin-category-empty">{categories.length ? "Nenhuma categoria corresponde à busca." : "Nenhuma categoria cadastrada. Comece criando a primeira."}</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="admin-category-footnote">Categorias não são excluídas permanentemente. Desative aquelas que não devem mais aparecer na loja, preservando o histórico dos produtos.</p>

      {modalOpen && (
        <div className="admin-category-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) setModalOpen(false); }}>
          <section className="admin-category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <header><div><span>CATÁLOGO</span><h2 id="category-modal-title">{editing ? "Editar categoria" : "Nova categoria"}</h2></div><button type="button" onClick={() => setModalOpen(false)} disabled={isPending} aria-label="Fechar"><X size={20} /></button></header>
            <form onSubmit={handleSubmit}>
              <label>Nome da categoria<input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Ex.: Camisetas" required minLength={2} /></label>
              <label>Descrição <span>(opcional)</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={3} placeholder="Descreva brevemente esta categoria..." /></label>
              <label>Ordem de exibição<input type="number" min="0" step="1" value={order} onChange={(event) => setOrder(event.target.value)} required /></label>
              {feedback && <p className="admin-category-feedback is-error" role="alert">{feedback}</p>}
              <footer><button type="button" className="admin-category-secondary" onClick={() => setModalOpen(false)} disabled={isPending}>Cancelar</button><button type="submit" className="admin-category-primary" disabled={isPending}>{isPending ? "Salvando..." : editing ? "Salvar alterações" : "Criar categoria"}</button></footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
