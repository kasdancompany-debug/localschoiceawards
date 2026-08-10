import "server-only";

import { withSoftTimeout } from "@/lib/async/soft-timeout";
import { mapProduct, mapVariant } from "@/lib/commerce/mappers";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { CommerceCurrency, CatalogProduct } from "@/types/commerce";

export type { CatalogProduct };

export async function listActiveCatalogProducts(
  currency?: CommerceCurrency,
): Promise<CatalogProduct[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const query = supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("name");

    const { data, error } = await withSoftTimeout(
      query,
      { data: null, error: null } as unknown as Awaited<typeof query>,
    );
    if (error || !data) {
      return [];
    }

    return data.map((row) => {
      const product = mapProduct(row);
      const variants = ((row.product_variants as unknown as Array<Parameters<typeof mapVariant>[0]>) ?? [])
        .map(mapVariant)
        .filter((variant) => variant.active)
        .filter((variant) => (currency ? variant.currencyCode === currency : true));
      return { ...product, variants };
    });
  } catch {
    return [];
  }
}

export async function getCatalogProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const products = await listActiveCatalogProducts();
  return products.find((product) => product.slug === slug) ?? null;
}
