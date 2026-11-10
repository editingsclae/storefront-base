// Choosing a variant by its options (Size, Color...) on the product page. No React
// here, so the rules can be tested on their own.

import type { Product, ProductVariant } from "@/lib/medusa";

export type OptionGroup = {
  id: string;
  title: string;
  values: string[];
};

// What a button for one value looks like
export type ValueState = "available" | "unavailable" | "gone";

// The picker is shown only for products with several variants. The placeholder
// option every product without options has ("Default Option") is never shown.
export function optionGroups(product: Product): OptionGroup[] {
  const variants = product.variants || [];
  if (variants.length <= 1) return [];
  return (product.options || [])
    .filter((o) => o.title !== "Default Option")
    .map((o) => {
      // Only values a variant uses, in the order the product lists them
      const used = new Set<string>();
      for (const v of variants) {
        const value = valueOf(v, o.id);
        if (value !== undefined) used.add(value);
      }
      return {
        id: o.id,
        title: o.title,
        values: (o.values || []).map((x) => x.value).filter((x) => used.has(x)),
      };
    })
    .filter((g) => g.values.length > 0);
}

export function valueOf(variant: ProductVariant, optionId: string): string | undefined {
  return variant.options?.find((o) => o.option_id === optionId)?.value;
}

export const inStock = (v: ProductVariant) =>
  v.inventory_quantity === undefined || v.inventory_quantity === null || v.inventory_quantity > 0;

export type Selection = Record<string, string>;

const selectionOf = (variant: ProductVariant, groups: OptionGroup[]): Selection => {
  const selection: Selection = {};
  for (const g of groups) {
    const value = valueOf(variant, g.id);
    if (value !== undefined) selection[g.id] = value;
  }
  return selection;
};

// The variant that has exactly these values
export function findVariant(product: Product, groups: OptionGroup[], selection: Selection): ProductVariant | undefined {
  return (product.variants || []).find((v) => groups.every((g) => valueOf(v, g.id) === selection[g.id]));
}

// The first choice: the first variant that can be bought, or else the first one
export function initialSelection(product: Product, groups: OptionGroup[]): Selection {
  const variants = product.variants || [];
  const first = variants.find(inStock) || variants[0];
  return first ? selectionOf(first, groups) : {};
}

// How the button for `value` of `optionId` looks, given what is chosen for the
// other options:
// - available: that combination exists and can be bought
// - unavailable: it exists but is sold out, or does not exist (greyed out)
// - gone: no variant with this value can be bought at all (greyed out, not clickable)
export function valueState(
  product: Product,
  groups: OptionGroup[],
  selection: Selection,
  optionId: string,
  value: string
): ValueState {
  const withValue = (product.variants || []).filter((v) => valueOf(v, optionId) === value);
  if (!withValue.some(inStock)) return "gone";
  const fits = withValue.filter((v) =>
    groups.every((g) => g.id === optionId || selection[g.id] === undefined || valueOf(v, g.id) === selection[g.id])
  );
  return fits.some(inStock) ? "available" : "unavailable";
}

// The choice after a click. The other options stay as they are when that makes a
// variant that can be bought; if not, they move to the closest one that can:
// first the one that differs least from what was chosen.
export function choose(
  product: Product,
  groups: OptionGroup[],
  selection: Selection,
  optionId: string,
  value: string
): Selection {
  const wanted: Selection = { ...selection, [optionId]: value };
  const exact = findVariant(product, groups, wanted);
  if (exact && inStock(exact)) return wanted;

  const candidates = (product.variants || []).filter((v) => valueOf(v, optionId) === value && inStock(v));
  if (candidates.length === 0) return selection;

  const score = (v: ProductVariant) => groups.filter((g) => g.id !== optionId && valueOf(v, g.id) === selection[g.id]).length;
  // Most values kept; the first one in the product's order on a tie
  const best = candidates.reduce((a, b) => (score(b) > score(a) ? b : a));
  return selectionOf(best, groups);
}

// "From 20 TND" for a product whose variants do not all cost the same
export function priceRange(variants: ProductVariant[]): { low: number; high: number; currency: string } | null {
  const prices = variants
    .map((v) => v.calculated_price)
    .filter((p): p is NonNullable<ProductVariant["calculated_price"]> => !!p);
  if (prices.length === 0) return null;
  const amounts = prices.map((p) => p.calculated_amount);
  return { low: Math.min(...amounts), high: Math.max(...amounts), currency: prices[0].currency_code };
}

// The variant name in the cart: not for the placeholder a product without options has
export function showVariantTitle(title: string | undefined | null): boolean {
  return !!title && title !== "Default Variant" && title !== "Default" && title !== "Default Option";
}

