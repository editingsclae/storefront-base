import { describe, it, expect } from "vitest";
import { getCardState } from "@/logic/product-card";
import type { Product } from "@/logic/types";

describe("product-card getCardState", () => {
  it("allows quick add for a single variant in stock", () => {
    const product: Product = {
      id: "prod_1",
      title: "Canvas Tote",
      handle: "canvas-tote",
      subtitle: "Durable cotton bag",
      description: "Description that must not be used on the card",
      variants: [
        {
          id: "var_1",
          title: "Default",
          inventory_quantity: 10,
          calculated_price: { calculated_amount: 30, original_amount: 30, currency_code: "TND" },
        },
      ],
    };

    const state = getCardState(product);
    expect(state.hasSingleVariant).toBe(true);
    expect(state.isSingleVariantInStock).toBe(true);
    expect(state.canQuickAdd).toBe(true);
    expect(state.subtitle).toBe("Durable cotton bag");
    expect(state.hasRange).toBe(false);
  });

  it("requires choose options when product has multiple variants even if all are in stock", () => {
    const product: Product = {
      id: "prod_multi",
      title: "Sneakers",
      handle: "sneakers",
      variants: [
        {
          id: "v1",
          title: "41",
          inventory_quantity: 4,
          calculated_price: { calculated_amount: 120, original_amount: 120, currency_code: "TND" },
        },
        {
          id: "v2",
          title: "42",
          inventory_quantity: 2,
          calculated_price: { calculated_amount: 120, original_amount: 120, currency_code: "TND" },
        },
      ],
    };

    const state = getCardState(product);
    expect(state.hasSingleVariant).toBe(false);
    expect(state.canQuickAdd).toBe(false);
    expect(state.hasRange).toBe(false);
  });

  it("identifies sold out state when all variants have 0 stock", () => {
    const product: Product = {
      id: "prod_sold_out",
      title: "Limited Edition Jacket",
      handle: "limited-jacket",
      variants: [
        {
          id: "v1",
          title: "Default",
          inventory_quantity: 0,
          calculated_price: { calculated_amount: 199, original_amount: 199, currency_code: "TND" },
        },
      ],
    };

    const state = getCardState(product);
    expect(state.canQuickAdd).toBe(false);
    expect(state.stockBadge).toEqual({
      type: "out_of_stock",
      label: "Out of stock",
    });
  });

  it("sets low stock badge when total stock is between 1 and 5", () => {
    const product: Product = {
      id: "prod_low_stock",
      title: "Rare Watch",
      handle: "rare-watch",
      variants: [
        {
          id: "v1",
          title: "Default",
          inventory_quantity: 3,
          calculated_price: { calculated_amount: 450, original_amount: 450, currency_code: "TND" },
        },
      ],
    };

    const state = getCardState(product);
    expect(state.stockBadge).toEqual({
      type: "low_stock",
      label: "Only 3 left",
      count: 3,
    });
  });

  it("detects price range (From price) when variants differ in calculated amount", () => {
    const product: Product = {
      id: "prod_diff_prices",
      title: "Perfume",
      handle: "perfume",
      variants: [
        {
          id: "v_50ml",
          title: "50ml",
          inventory_quantity: 5,
          calculated_price: { calculated_amount: 80, original_amount: 80, currency_code: "TND" },
        },
        {
          id: "v_100ml",
          title: "100ml",
          inventory_quantity: 5,
          calculated_price: { calculated_amount: 140, original_amount: 140, currency_code: "TND" },
        },
      ],
    };

    const state = getCardState(product);
    expect(state.hasRange).toBe(true);
    expect(state.range).toEqual({ low: 80, high: 140, currency: "TND" });
  });

  it("shows product.subtitle only (never description) and null when empty or whitespace", () => {
    const productWithOnlyDesc: Product = {
      id: "p1",
      title: "Item 1",
      handle: "item-1",
      description: "Should never show on card",
      variants: [],
    };
    expect(getCardState(productWithOnlyDesc).subtitle).toBeNull();

    const productWithBlankSub: Product = {
      id: "p2",
      title: "Item 2",
      handle: "item-2",
      subtitle: "   ",
      description: "Should never show on card",
      variants: [],
    };
    expect(getCardState(productWithBlankSub).subtitle).toBeNull();

    const productWithValidSub: Product = {
      id: "p3",
      title: "Item 3",
      handle: "item-3",
      subtitle: "  Handmade in Tunisia  ",
      description: "Long details",
      variants: [],
    };
    expect(getCardState(productWithValidSub).subtitle).toBe("Handmade in Tunisia");
  });
});

