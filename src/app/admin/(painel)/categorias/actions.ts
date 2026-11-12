"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(80, "O nome deve ter no máximo 80 caracteres."),
  description: z.string().trim().max(300, "A descrição deve ter no máximo 300 caracteres."),
  display_order: z.number().int().min(0, "A ordem não pode ser negativa."),
});

type ActionResult = { success: boolean; message: string };

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase: null, error: "Sua sessão expirou. Entre novamente." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { supabase: null, error: "Você não tem permissão para realizar esta operação." };
  }

  return { supabase, error: null };
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>, name: string, currentId?: string) {
  const base = createSlug(name) || "categoria";
  let candidate = base;

  for (let suffix = 2; suffix <= 50; suffix += 1) {
    let query = supabase.from("categories").select("id").eq("slug", candidate);
    if (currentId) query = query.neq("id", currentId);
    const { data, error } = await query.maybeSingle();

    if (error) throw new Error("Não foi possível validar o endereço da categoria.");
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
  }

  throw new Error("Não foi possível gerar um endereço exclusivo para esta categoria.");
}

export async function saveCategory(input: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { supabase, error: permissionError } = await getAdminClient();
  if (!supabase) return { success: false, message: permissionError ?? "Acesso negado." };

  const { id, name, description, display_order } = parsed.data;

  try {
    const slug = await uniqueSlug(supabase, name, id || undefined);
    const payload = {
      name,
      slug,
      description: description || null,
      display_order,
      updated_at: new Date().toISOString(),
    };

    const result = id
      ? await supabase.from("categories").update(payload).eq("id", id).select("id").maybeSingle()
      : await supabase.from("categories").insert(payload).select("id").single();

    if (result.error || !result.data) {
      if (result.error?.code === "23505") {
        return { success: false, message: "Já existe uma categoria com esse endereço. Altere o nome e tente novamente." };
      }
      return { success: false, message: "Não foi possível salvar a categoria. Tente novamente." };
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/admin");
    return { success: true, message: id ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro ao salvar a categoria." };
  }
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || typeof isActive !== "boolean") {
    return { success: false, message: "Dados inválidos para atualizar a categoria." };
  }

  const { supabase, error: permissionError } = await getAdminClient();
  if (!supabase) return { success: false, message: permissionError ?? "Acesso negado." };

  const { data, error } = await supabase
    .from("categories")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { success: false, message: "Não foi possível atualizar o status da categoria." };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/admin");
  return { success: true, message: isActive ? "Categoria ativada." : "Categoria desativada." };
}
