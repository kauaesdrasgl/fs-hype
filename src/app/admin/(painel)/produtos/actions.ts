"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000).optional().default(""),
  category_id: z.string().uuid().nullable(),
  price: z.number().positive(),
  cost_price: z.number().min(0).nullable(),
  sale_price: z.number().positive().nullable(),
  is_featured: z.boolean(),
  status: z.enum(["draft", "published"]),
  colors: z.array(z.object({
    name: z.string().trim().min(1).max(40),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    sizes: z.array(z.string().trim().min(1).max(12)).min(1).max(20),
  })).min(1).max(20),
});

type ActionResult = { success: boolean; message: string };

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { supabase: null, error: "Sua sessão expirou. Entre novamente." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profileError || profile?.role !== "admin") {
    return { supabase: null, error: "Você não tem permissão para realizar esta operação." };
  }
  return { supabase, error: null };
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "produto";
}

async function uniqueProductSlug(supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>, name: string) {
  const base = slugify(name);
  let candidate = base;
  for (let suffix = 2; suffix <= 100; suffix += 1) {
    const { data, error } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (error) throw new Error("Não foi possível validar o endereço do produto.");
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
  }
  throw new Error("Não foi possível gerar um endereço exclusivo para o produto.");
}

export async function createProduct(input: unknown): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os dados do produto." };
  }

  const data = parsed.data;
  const normalizedColors = data.colors.map((color) => ({
    ...color,
    name: color.name.trim(),
    sizes: [...new Set(color.sizes.map((size) => size.trim()).filter(Boolean))],
  }));

  if (normalizedColors.some((color) => color.sizes.length === 0)) {
    return { success: false, message: "Cada cor precisa ter pelo menos um tamanho." };
  }
  if (new Set(normalizedColors.map((color) => color.name.toLocaleLowerCase("pt-BR"))).size !== normalizedColors.length) {
    return { success: false, message: "Não repita nomes de cores no mesmo produto." };
  }

  const { supabase, error: permissionError } = await getAdminClient();
  if (!supabase) return { success: false, message: permissionError ?? "Acesso negado." };

  let productId: string | null = null;
  try {
    if (data.category_id) {
      const { data: category, error } = await supabase.from("categories")
        .select("id").eq("id", data.category_id).eq("is_active", true).maybeSingle();
      if (error || !category) return { success: false, message: "A categoria selecionada não está disponível." };
    }

    const slug = await uniqueProductSlug(supabase, data.name);
    const { data: product, error: productError } = await supabase.from("products").insert({
      category_id: data.category_id,
      name: data.name,
      slug,
      description: data.description || null,
      price: data.price,
      cost_price: data.cost_price,
      sale_price: data.sale_price,
      is_featured: data.is_featured,
      status: data.status,
    }).select("id").single();

    if (productError || !product) {
      return { success: false, message: productError?.code === "23505"
        ? "Já existe um produto com dados semelhantes. Verifique o cadastro."
        : "Não foi possível criar o produto. Confira os dados e tente novamente." };
    }
    productId = product.id;

    for (let colorIndex = 0; colorIndex < normalizedColors.length; colorIndex += 1) {
      const color = normalizedColors[colorIndex];
      const { data: savedColor, error: colorError } = await supabase.from("product_colors").insert({
        product_id: product.id,
        name: color.name,
        hex: color.hex,
        display_order: colorIndex,
        is_active: true,
      }).select("id").single();

      if (colorError || !savedColor) throw new Error("O produto foi criado, mas não foi possível salvar suas cores.");

      const variants = color.sizes.map((size) => ({
        product_id: product.id,
        color_id: savedColor.id,
        color_name: color.name,
        color_hex: color.hex,
        size_label: size,
        sku: `${slug.slice(0, 22)}-${slugify(color.name).slice(0, 10)}-${slugify(size).slice(0, 8)}`.toUpperCase(),
        stock_quantity: 0,
        is_active: true,
      }));

      const { error: variantsError } = await supabase.from("product_variants").insert(variants);
      if (variantsError) throw new Error("O produto foi criado, mas houve falha ao gerar as variações. Tente novamente.");
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/admin");
    return { success: true, message: "Produto cadastrado com sucesso. O estoque inicial permanece zerado até o lançamento de uma movimentação." };
  } catch (error) {
    if (productId) {
      await supabase.from("products").delete().eq("id", productId);
    }
    return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar o produto." };
  }
}
