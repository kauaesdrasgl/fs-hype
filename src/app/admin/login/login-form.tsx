"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage({ permissionError = false }: { permissionError?: boolean }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError || !data.user) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError("Esta conta não possui permissão de administrador.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Não foi possível realizar o login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link href="/" className="admin-login-brand">
          FStore<span>.</span>
        </Link>

        <p className="admin-login-eyebrow">ÁREA RESTRITA</p>
        <h1>Painel administrativo</h1>
        <p className="admin-login-description">
          Entre com suas credenciais de administrador para continuar.
        </p>

        <form onSubmit={handleLogin} className="admin-login-form">
          <label htmlFor="admin-email">E-mail</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            required
          />

          <label htmlFor="admin-password">Senha</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            required
          />

          {error && <p className="admin-login-error">{error}</p>}

          {permissionError && (
            <p className="admin-login-error">
              Sua conta não tem autorização para acessar o painel.
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Entrar no painel"}
          </button>
        </form>

        <Link href="/" className="admin-login-back">
          Voltar para a loja
        </Link>
      </section>
    </main>
  );
}
