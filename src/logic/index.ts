export * from "./shop-filters";
export * from "./use-shop-filters";
export * from "./variant-select";
export * from "./product-card";
export * from "./use-variant-select";
export * from "./checkout-validation";
export * from "./use-checkout";
export * from "./cart-view";
export * from "./use-cart-view";

// Types and pure formatting utilities from medusa
export type {
  Product,
  ProductVariant,
  MerchantCategory,
  CategoryTile,
  Banner,
  Region,
} from "@/lib/medusa";

export {
  cleanCategoryHandle,
  formatPrice,
  STORE_NAME,
} from "@/lib/medusa";
