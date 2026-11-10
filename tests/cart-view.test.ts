import { describe, it, expect } from "vitest";
import {
  getCartLineItemTotal,
  getCartSubtotal,
  isCartEmpty,
  getCartItemCount,
  getCartSummaryTotals,
  getLineItemState,
  showVariantTitle,
} from "@/logic/cart-view";
import type { Cart, LineItem } from "@/logic/types";

describe("cart-view", () => {
  const sampleItem1: LineItem = {
    id: "item_1",
    title: "Cotton Shirt",
    variant_title: "Medium / Blue",
    quantity: 2,
    unit_price: 45,
    subtotal: 90,
    total: 90,
    variant_id: "v_1",
    product_id: "p_1",
  };

  const sampleItem2: LineItem = {
    id: "item_2",
    title: "Leather Belt",
    variant_title: "Default Variant",
    quantity: 1,
    unit_price: 30,
    subtotal: 30,
    total: 30,
    variant_id: "v_2",
    product_id: "p_2",
  };

  const sampleCart: Cart = {
    id: "cart_abc",
    email: "test@example.com",
    region_id: "reg_1",
    shipping_total: 7,
    currency_code: "TND",
    items: [sampleItem1, sampleItem2],
    item_subtotal: 120,
    subtotal: 120,
    shipping_subtotal: 7,
    tax_total: 0,
    total: 127,
  };

  describe("empty state and count", () => {
    it("identifies empty cart correctly", () => {
      expect(isCartEmpty(null)).toBe(true);
      expect(isCartEmpty({ id: "c1", items: [] } as unknown as Cart)).toBe(true);
      expect(isCartEmpty(sampleCart)).toBe(false);
    });

    it("counts total item quantities", () => {
      expect(getCartItemCount(null)).toBe(0);
      expect(getCartItemCount({ id: "c1", items: [] } as unknown as Cart)).toBe(0);
      expect(getCartItemCount(sampleCart)).toBe(3);
    });
  });

  describe("totals", () => {
    it("computes single line item total fallback when subtotal missing", () => {
      expect(getCartLineItemTotal(sampleItem1)).toBe(90);
      expect(getCartLineItemTotal({ unit_price: 25, quantity: 4 } as LineItem)).toBe(100);
    });

    it("gets cart subtotal", () => {
      expect(getCartSubtotal(sampleCart)).toBe(120);
      expect(getCartSubtotal(null)).toBe(0);
    });

    it("returns cart summary totals", () => {
      const summary = getCartSummaryTotals(sampleCart);
      expect(summary.itemsSubtotal).toBe(120);
      expect(summary.shippingSubtotal).toBe(7);
      expect(summary.hasShippingSubtotal).toBe(true);
      expect(summary.hasTaxTotal).toBe(false);
      expect(summary.total).toBe(127);
    });
  });

  describe("line item view state & placeholder variant title hiding", () => {
    it("hides placeholder variant titles like Default, Default Variant, Default Option", () => {
      expect(showVariantTitle("Default")).toBe(false);
      expect(showVariantTitle("Default Variant")).toBe(false);
      expect(showVariantTitle("Default Option")).toBe(false);
      expect(showVariantTitle(undefined)).toBe(false);
      expect(showVariantTitle(null)).toBe(false);
      expect(showVariantTitle("Size M")).toBe(true);
    });

    it("provides correct line item state with showVariant flag", () => {
      const state1 = getLineItemState(sampleItem1);
      expect(state1.showVariant).toBe(true);
      expect(state1.canDecrease).toBe(true); // quantity is 2
      expect(state1.canIncrease).toBe(true);
      expect(state1.isBusy).toBe(false);

      const state2 = getLineItemState(sampleItem2, "item_2", { item_2: "Not enough stock" });
      expect(state2.showVariant).toBe(false); // "Default Variant" is hidden
      expect(state2.canDecrease).toBe(false); // quantity is 1 and busy
      expect(state2.canIncrease).toBe(false); // busy
      expect(state2.isBusy).toBe(true);
      expect(state2.error).toBe("Not enough stock");
    });
  });
});

