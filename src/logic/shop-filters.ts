import type { Product, MerchantCategory } from "@/lib/medusa";
import { cleanCategoryHandle } from "@/lib/medusa";

export interface CatalogOption {
  title: string;
  paramName: string;
  values: string[];
}

export interface FilterCriteria {
  q?: string;
  categoryHandles?: string[];
  fixedCategory?: MerchantCategory;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  optionFilters?: Map<string, string[]>;
}

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getProductLowestPrice(product: Product): number | null {
  let lowest: number | null = null;
  for (const v of product.variants || []) {
    const amount = v.calculated_price?.calculated_amount;
    if (typeof amount === "number" && !isNaN(amount)) {
      if (lowest === null || amount < lowest) {
        lowest = amount;
      }
    }
  }
  return lowest;
}

export function getCatalogPriceBounds(products: Product[]): {
  catalogMinPrice: number;
  catalogMaxPrice: number;
} {
  let min = Infinity;
  let max = -Infinity;
  for (const p of products) {
    const price = getProductLowestPrice(p);
    if (price !== null) {
      if (price < min) min = price;
      if (price > max) max = price;
    }
  }
  return {
    catalogMinPrice: min === Infinity ? 0 : Math.floor(min),
    catalogMaxPrice: max === -Infinity ? 0 : Math.ceil(max),
  };
}

export function getCategoryCounts(products: Product[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const c of p.categories || []) {
      const clean = cleanCategoryHandle(c.handle).toLowerCase();
      counts.set(clean, (counts.get(clean) || 0) + 1);
    }
  }
  return counts;
}

export function getVisibleCategories(
  categories: MerchantCategory[],
  categoryCounts: Map<string, number>
): MerchantCategory[] {
  return categories.filter((cat) => {
    const clean = cleanCategoryHandle(cat.handle).toLowerCase();
    return (categoryCounts.get(clean) || 0) > 0;
  });
}

export function getCatalogOptions(products: Product[]): CatalogOption[] {
  const optionMap = new Map<
    string,
    { canonicalTitle: string; values: Set<string> }
  >();

  for (const product of products) {
    const optIdToKey = new Map<string, string>();
    for (const opt of product.options || []) {
      if (!opt.title) continue;
      const key = opt.title.trim().toLowerCase();
      optIdToKey.set(opt.id, key);
      let entry = optionMap.get(key);
      if (!entry) {
        entry = { canonicalTitle: opt.title.trim(), values: new Set() };
        optionMap.set(key, entry);
      }
      for (const val of opt.values || []) {
        if (val.value && val.value.trim()) {
          entry.values.add(val.value.trim());
        }
      }
    }
    for (const variant of product.variants || []) {
      for (const vo of variant.options || []) {
        const key = optIdToKey.get(vo.option_id);
        if (key && vo.value && vo.value.trim()) {
          optionMap.get(key)?.values.add(vo.value.trim());
        }
      }
    }
  }

  const options: CatalogOption[] = [];
  for (const [, entry] of optionMap.entries()) {
    if (entry.values.size >= 2) {
      options.push({
        title: entry.canonicalTitle,
        paramName: `opt_${entry.canonicalTitle}`,
        values: Array.from(entry.values).sort(),
      });
    }
  }
  return options.sort((a, b) => a.title.localeCompare(b.title));
}

export function filterProducts(
  products: Product[],
  criteria: FilterCriteria
): Product[] {
  const {
    q,
    categoryHandles = [],
    fixedCategory,
    minPrice = null,
    maxPrice = null,
    inStock = false,
    optionFilters = new Map(),
  } = criteria;

  return products.filter((product) => {
    // 1. Search (q)
    if (q) {
      const normQ = normalizeText(q);
      const matchesTitle = normalizeText(product.title).includes(normQ);
      const matchesSub = normalizeText(product.subtitle).includes(normQ);
      const matchesDesc = normalizeText(product.description).includes(normQ);
      if (!matchesTitle && !matchesSub && !matchesDesc) {
        return false;
      }
    }

    // 2. Categories (multi-select)
    if (!fixedCategory && categoryHandles.length > 0) {
      const productCatHandles = (product.categories || []).map((c) =>
        cleanCategoryHandle(c.handle).toLowerCase()
      );
      const matchesCat = categoryHandles.some((h) =>
        productCatHandles.includes(h)
      );
      if (!matchesCat) return false;
    }

    // 3. Price
    const lowestPrice = getProductLowestPrice(product);
    const isPriceFilterActive = minPrice !== null || maxPrice !== null;
    if (isPriceFilterActive) {
      if (lowestPrice === null) return false;
      if (minPrice !== null && lowestPrice < minPrice) return false;
      if (maxPrice !== null && lowestPrice > maxPrice) return false;
    }

    // 4. In stock only
    if (inStock) {
      const hasStock = (product.variants || []).some(
        (v) =>
          v.inventory_quantity === undefined ||
          v.inventory_quantity === null ||
          v.inventory_quantity > 0
      );
      if (!hasStock) return false;
    }

    // 5. Options
    if (optionFilters.size > 0) {
      const optIdToTitle = new Map<string, string>();
      for (const opt of product.options || []) {
        optIdToTitle.set(opt.id, opt.title.trim().toLowerCase());
      }

      for (const [optTitle, selectedVals] of optionFilters.entries()) {
        const targetTitleLower = optTitle.trim().toLowerCase();
        const targetValsLower = selectedVals.map((v: string) => v.toLowerCase());

        const variantMatches = (product.variants || []).some((v) => {
          return (v.options || []).some((vo) => {
            const voTitleLower = optIdToTitle.get(vo.option_id);
            if (voTitleLower === targetTitleLower) {
              return targetValsLower.includes(
                (vo.value || "").trim().toLowerCase()
              );
            }
            return false;
          });
        });

        if (!variantMatches) return false;
      }
    }

    return true;
  });
}

export function sortProducts(
  products: Product[],
  sort: string = "newest"
): Product[] {
  const list = [...products];
  if (sort === "price_asc") {
    list.sort((a, b) => {
      const priceA = getProductLowestPrice(a);
      const priceB = getProductLowestPrice(b);
      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;
      return priceA - priceB;
    });
  } else if (sort === "price_desc") {
    list.sort((a, b) => {
      const priceA = getProductLowestPrice(a);
      const priceB = getProductLowestPrice(b);
      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;
      return priceB - priceA;
    });
  } else if (sort === "name_asc") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // newest (created_at desc)
    list.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }
  return list;
}

export function formatResultRange(
  currentPage: number,
  pageSize: number,
  pageProductsCount: number,
  totalProducts: number,
  totalPages: number
): string {
  if (totalPages > 1) {
    const firstShown = (currentPage - 1) * pageSize + 1;
    const lastShown = firstShown + pageProductsCount - 1;
    return `${firstShown}\u2013${lastShown} of ${totalProducts} products`;
  }
  return `${totalProducts} ${totalProducts === 1 ? "product" : "products"}`;
}
