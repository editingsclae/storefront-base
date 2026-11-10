import type { Product, ProductVariant } from "@/lib/medusa";
import { priceRange } from "./variant-select";
import { productBadge } from "@/lib/product-badge";

export type StockBadgeState =
  | { type: "out_of_stock"; label: string }
  | { type: "low_stock"; label: string; count: number }
  | null;

export interface ProductCardState {
  variants: ProductVariant[];
  primaryVariant?: ProductVariant;
  singleVariant?: ProductVariant;
  hasSingleVariant: boolean;
  isSingleVariantInStock: boolean;
  canQuickAdd: boolean;
  price?: ProductVariant["calculated_price"];
  range: { low: number; high: number; currency: string } | null;
  hasRange: boolean;
  hasUnmanagedStock: boolean;
  totalStock: number;
  stockBadge: StockBadgeState;
  imageUrl?: string;
  badge: string | null;
  subtitle: string | null;
}

/**
 * Pure rule for product cards:
 * "show the quick Add only for exactly one variant in stock, otherwise Choose options,
 * sold out disabled, From price when variants differ"
 */
export function getCardState(product: Product): ProductCardState {
  const variants = product.variants || [];
  const primaryVariant = variants[0];
  const price = primaryVariant?.calculated_price;

  // Variants that do not all cost the same: "From" the lowest price
  const range = priceRange(variants);
  const hasRange = !!range && range.low !== range.high;

  // Calculate stock across variants
  let hasUnmanagedStock = false;
  let totalStock = 0;
  for (const v of variants) {
    if (v.inventory_quantity === undefined || v.inventory_quantity === null) {
      hasUnmanagedStock = true;
    } else {
      totalStock += v.inventory_quantity;
    }
  }

  // Stock badge rules:
  // "Out of stock" when 0, "Only N left" when 1 to 5, nothing otherwise.
  let stockBadge: StockBadgeState = null;
  if (!hasUnmanagedStock) {
    if (totalStock === 0) {
      stockBadge = {
        type: "out_of_stock",
        label: "Out of stock",
      };
    } else if (totalStock >= 1 && totalStock <= 5) {
      stockBadge = {
        type: "low_stock",
        label: `Only ${totalStock} left`,
        count: totalStock,
      };
    }
  }

  // Determine button state:
  // "If the product has exactly one variant and it is in stock, the button reads "Add to cart" and adds it (the drawer opens). Otherwise it reads "Choose options" and links to the product page."
  const hasSingleVariant = variants.length === 1;
  const singleVariant = variants[0];
  const isSingleVariantInStock =
    hasSingleVariant &&
    (singleVariant.inventory_quantity === undefined ||
      singleVariant.inventory_quantity === null ||
      singleVariant.inventory_quantity > 0);

  const canQuickAdd = hasSingleVariant && isSingleVariantInStock;
  const imageUrl = product.thumbnail || product.images?.[0]?.url;
  const badge = productBadge(product);
  const subtitle = product.subtitle?.trim() ? product.subtitle.trim() : null;

  return {
    variants,
    primaryVariant,
    singleVariant,
    hasSingleVariant,
    isSingleVariantInStock,
    canQuickAdd,
    price,
    range,
    hasRange,
    hasUnmanagedStock,
    totalStock,
    stockBadge,
    imageUrl,
    badge,
    subtitle,
  };
}

