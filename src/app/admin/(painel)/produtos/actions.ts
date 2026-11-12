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

const productImagesSchema = z.object({
  product_id: z.string().uuid(),
  images: z.array(z.object({
    color_id: z.string().uuid(),
    storage_path: z.string().min(1).max(500),
    alt_text: z.string().trim().max(200),
    display_order: z.number().int().min(0).max(20),
  })).min(1).max(100),
});

type CreateProductResult =
  | { success: true; message: string; productId: string; colors: { id: string; name: string }[] }
  | { success: false; message: string };
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

export async function createProduct(input: unknown): Promise<CreateProductResult> {
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
  const savedColors: { id: string; name: string }[] = [];
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
      if (productError?.code === "23505") {
        return { success: false, message: "Já existe um produto com dados semelhantes. Verifique o cadastro." };
      }
      console.error("[FStore createProduct] Falha ao inserir produto:", {
        code: productError?.code,
        message: productError?.message,
        details: productError?.details,
        hint: productError?.hint,
      });
      return {
        success: false,
        message: productError
          ? "Falha ao salvar no banco (" + (productError.code || "sem código") + "): " + productError.message
          : "O banco não retornou os dados do produto criado.",
      };
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
      savedColors.push({ id: savedColor.id, name: color.name });

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
    return {
      success: true,
      productId: product.id,
      colors: savedColors,
      message: "Produto cadastrado com sucesso. O estoque inicial permanece zerado até o lançamento de uma movimentação.",
    };
  } catch (error) {
    if (productId) {
      await supabase.from("products").delete().eq("id", productId);
    }
    return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar o produto." };
  }
}

export async function attachProductImages(input: unknown): Promise<ActionResult> {
  const parsed = productImagesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Os dados das imagens são inválidos." };
  }

  const { supabase, error: permissionError } = await getAdminClient();
  if (!supabase) return { success: false, message: permissionError ?? "Acesso negado." };

  const { product_id: productId, images } = parsed.data;
  const colorIds = [...new Set(images.map((image) => image.color_id))];

  const { data: colors, error: colorsError } = await supabase
    .from("product_colors")
    .select("id")
    .eq("product_id", productId)
    .in("id", colorIds);

  if (colorsError || !colors || colors.length !== colorIds.length) {
    return { success: false, message: "Uma ou mais cores não pertencem a este produto." };
  }

  const invalidPath = images.some((image) =>
    !image.storage_path.startsWith(`products/${productId}/${image.color_id}/`) ||
    image.storage_path.includes("..")
  );
  if (invalidPath) {
    return { success: false, message: "O caminho de armazenamento de uma imagem é inválido." };
  }

  const rows = images.map((image) => ({
    product_id: productId,
    color_id: image.color_id,
    storage_path: image.storage_path,
    alt_text: image.alt_text,
    display_order: image.display_order,
    is_primary: image.display_order === 0,
  }));

  const { error: insertError } = await supabase.from("product_images").insert(rows);
  if (insertError) {
    return { success: false, message: "As imagens foram enviadas, mas não foi possível vinculá-las ao produto. Tente novamente." };
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/admin");
  return { success: true, message: "Imagens vinculadas ao produto com sucesso." };
}
