import { describe, it, expect } from "vitest";
import {
  filterProducts,
  sortProducts,
  formatResultRange,
  normalizeText,
  getProductLowestPrice,
  getCatalogPriceBounds,
  getCategoryCounts,
  getVisibleCategories,
  getCatalogOptions,
} from "@/logic/shop-filters";
import type { Product, MerchantCategory } from "@/logic/types";

describe("shop-filters", () => {
  const sampleProducts: Product[] = [
    {
      id: "prod_1",
      title: "Élégant Manteau",
      handle: "elegant-manteau",
      subtitle: "Collection d'Hiver",
      description: "Chaud et confortable en laine.",
      created_at: "2026-01-01T10:00:00Z",
      categories: [{ id: "cat_coats", name: "Coats", handle: "coats" }],
      variants: [
        {
          id: "var_1a",
          title: "S",
          inventory_quantity: 5,
          calculated_price: { calculated_amount: 120, original_amount: 120, currency_code: "TND" },
          options: [{ id: "vo_1", option_id: "opt_size", value: "S" }],
        },
        {
          id: "var_1b",
          title: "M",
          inventory_quantity: 0,
          calculated_price: { calculated_amount: 140, original_amount: 140, currency_code: "TND" },
          options: [{ id: "vo_2", option_id: "opt_size", value: "M" }],
        },
      ],
      options: [
        { id: "opt_size", title: "Size", values: [{ id: "v1", value: "S" }, { id: "v2", value: "M" }] },
      ],
    },
    {
      id: "prod_2",
      title: "Basic T-Shirt",
      handle: "basic-t-shirt",
      subtitle: "Everyday wear",
      description: "Simple cotton t-shirt with unmanaged inventory.",
      created_at: "2026-02-01T10:00:00Z",
      categories: [{ id: "cat_tops", name: "Tops", handle: "tops" }],
      variants: [
        {
          id: "var_2a",
          title: "Default",
          // inventory_quantity is undefined/null (unmanaged stock)
          inventory_quantity: undefined,
          calculated_price: { calculated_amount: 35, original_amount: 35, currency_code: "TND" },
        },
      ],
      options: [],
    },
    {
      id: "prod_3",
      title: "Sold Out Shoes",
      handle: "sold-out-shoes",
      subtitle: "Retro sneakers",
      description: "Vintage style runners.",
      created_at: "2026-03-01T10:00:00Z",
      categories: [{ id: "cat_shoes", name: "Shoes", handle: "shoes" }],
      variants: [
        {
          id: "var_3a",
          title: "42",
          inventory_quantity: 0,
          calculated_price: { calculated_amount: 200, original_amount: 200, currency_code: "TND" },
        },
      ],
      options: [],
    },
    {
      id: "prod_4",
      title: "Free Gift Item",
      handle: "free-gift",
      subtitle: "Bonus",
      description: "Complimentary promotional item without a set price.",
      created_at: "2025-12-01T10:00:00Z",
      categories: [],
      variants: [
        {
          id: "var_4a",
          title: "Standard",
          inventory_quantity: 10,
          // no calculated_price
        },
      ],
      options: [],
    },
  ];

  describe("pure helpers", () => {
    it("normalizeText strips accents and lowercases", () => {
      expect(normalizeText("Élégant")).toBe("elegant");
      expect(normalizeText(null)).toBe("");
    });

    it("getProductLowestPrice returns lowest price among variants", () => {
      expect(getProductLowestPrice(sampleProducts[0])).toBe(120);
      expect(getProductLowestPrice(sampleProducts[3])).toBeNull();
    });
  });

  describe("search matching (accent and case insensitive)", () => {
    it("matches normalized query against title", () => {
      const result = filterProducts(sampleProducts, { q: "elegant" });
      expect(result.map((p) => p.id)).toEqual(["prod_1"]);
    });

    it("matches query with accents against unaccented text", () => {
      const result = filterProducts(sampleProducts, { q: "ÉLÉGANT" });
      expect(result.map((p) => p.id)).toEqual(["prod_1"]);
    });

    it("matches query against subtitle", () => {
      const result = filterProducts(sampleProducts, { q: "hiver" });
      expect(result.map((p) => p.id)).toEqual(["prod_1"]);
    });

    it("matches query against description", () => {
      const result = filterProducts(sampleProducts, { q: "laine" });
      expect(result.map((p) => p.id)).toEqual(["prod_1"]);
    });

    it("returns empty when query does not match", () => {
      const result = filterProducts(sampleProducts, { q: "nonexistent" });
      expect(result).toHaveLength(0);
    });
  });

  describe("category filter", () => {
    it("filters products by category handle", () => {
      const result = filterProducts(sampleProducts, { categoryHandles: ["tops"] });
      expect(result.map((p) => p.id)).toEqual(["prod_2"]);
    });

    it("filters products by multiple category handles", () => {
      const result = filterProducts(sampleProducts, { categoryHandles: ["coats", "shoes"] });
      expect(result.map((p) => p.id)).toEqual(["prod_1", "prod_3"]);
    });

    it("respects clean category handles with prefix/special chars", () => {
      const counts = getCategoryCounts(sampleProducts);
      expect(counts.get("coats")).toBe(1);
      expect(counts.get("tops")).toBe(1);
      expect(counts.get("shoes")).toBe(1);
    });

    it("returns only visible categories with product count > 0", () => {
      const allCategories: MerchantCategory[] = [
        { id: "c1", name: "Coats", handle: "coats", description: null, rank: 0, product_count: 1 },
        { id: "c2", name: "Empty Cat", handle: "empty", description: null, rank: 1, product_count: 0 },
      ];
      const counts = getCategoryCounts(sampleProducts);
      const visible = getVisibleCategories(allCategories, counts);
      expect(visible.map((c) => c.handle)).toEqual(["coats"]);
    });
  });

  describe("price filter", () => {
    it("filters by minPrice", () => {
      const result = filterProducts(sampleProducts, { minPrice: 100 });
      expect(result.map((p) => p.id)).toEqual(["prod_1", "prod_3"]);
    });

    it("filters by maxPrice", () => {
      const result = filterProducts(sampleProducts, { maxPrice: 100 });
      expect(result.map((p) => p.id)).toEqual(["prod_2"]);
    });

    it("filters by minPrice and maxPrice range", () => {
      const result = filterProducts(sampleProducts, { minPrice: 30, maxPrice: 50 });
      expect(result.map((p) => p.id)).toEqual(["prod_2"]);
    });

    it("excludes products without a price when price filter is active", () => {
      const result = filterProducts(sampleProducts, { minPrice: 0, maxPrice: 500 });
      expect(result.map((p) => p.id)).not.toContain("prod_4");
    });

    it("calculates catalog price bounds properly", () => {
      const bounds = getCatalogPriceBounds(sampleProducts);
      expect(bounds.catalogMinPrice).toBe(35);
      expect(bounds.catalogMaxPrice).toBe(200);
    });
  });

  describe("in stock only filter", () => {
    it("keeps products with positive stock and products with unmanaged inventory", () => {
      const result = filterProducts(sampleProducts, { inStock: true });
      expect(result.map((p) => p.id)).toEqual(["prod_1", "prod_2", "prod_4"]);
      expect(result.map((p) => p.id)).not.toContain("prod_3");
    });
  });

  describe("option filters", () => {
    it("extracts catalog options with at least 2 distinct values", () => {
      const options = getCatalogOptions(sampleProducts);
      expect(options).toEqual([
        {
          title: "Size",
          paramName: "opt_Size",
          values: ["M", "S"],
        },
      ]);
    });

    it("filters products by option values", () => {
      const map = new Map<string, string[]>();
      map.set("Size", ["S"]);
      const result = filterProducts(sampleProducts, { optionFilters: map });
      expect(result.map((p) => p.id)).toEqual(["prod_1"]);
    });

    it("excludes products not matching option value", () => {
      const map = new Map<string, string[]>();
      map.set("Size", ["XL"]);
      const result = filterProducts(sampleProducts, { optionFilters: map });
      expect(result).toHaveLength(0);
    });
  });

  describe("sortProducts", () => {
    it("sorts by newest (created_at desc)", () => {
      const sorted = sortProducts(sampleProducts, "newest");
      expect(sorted.map((p) => p.id)).toEqual(["prod_3", "prod_2", "prod_1", "prod_4"]);
    });

    it("sorts by price_asc with unpriced items at the end", () => {
      const sorted = sortProducts(sampleProducts, "price_asc");
      expect(sorted.map((p) => p.id)).toEqual(["prod_2", "prod_1", "prod_3", "prod_4"]);
    });

    it("sorts by price_desc with unpriced items at the end", () => {
      const sorted = sortProducts(sampleProducts, "price_desc");
      expect(sorted.map((p) => p.id)).toEqual(["prod_3", "prod_1", "prod_2", "prod_4"]);
    });

    it("sorts by name_asc", () => {
      const sorted = sortProducts(sampleProducts, "name_asc");
      expect(sorted.map((p) => p.id)).toEqual(["prod_2", "prod_1", "prod_4", "prod_3"]);
    });
  });

  describe("formatResultRange", () => {
    it("formats multi-page range", () => {
      expect(formatResultRange(1, 15, 15, 42, 3)).toBe("1\u201315 of 42 products");
      expect(formatResultRange(2, 15, 15, 42, 3)).toBe("16\u201330 of 42 products");
      expect(formatResultRange(3, 15, 12, 42, 3)).toBe("31\u201342 of 42 products");
    });

    it("formats single-page results", () => {
      expect(formatResultRange(1, 15, 1, 1, 1)).toBe("1 product");
      expect(formatResultRange(1, 15, 5, 5, 1)).toBe("5 products");
    });
  });
});
