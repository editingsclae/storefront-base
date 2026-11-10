import { describe, it, expect } from "vitest";
import { getOrderTotals } from "@/logic/order-totals";
import type { Order } from "@/logic/types";

describe("order-totals", () => {
  it("order with shipping_subtotal 0 gives isShippingFree true", () => {
    const order = {
      id: "ord_1",
      currency_code: "TND",
      item_subtotal: 100,
      subtotal: 100,
      shipping_subtotal: 0,
      tax_total: 0,
      total: 100,
    } as unknown as Order;

    const totals = getOrderTotals(order);
    expect(totals.isShippingFree).toBe(true);
    expect(totals.shippingSubtotal).toBe(0);
  });

  it("shipping_subtotal 12 gives isShippingFree false", () => {
    const order = {
      id: "ord_2",
      currency_code: "TND",
      item_subtotal: 100,
      subtotal: 100,
      shipping_subtotal: 12,
      tax_total: 0,
      total: 112,
    } as unknown as Order;

    const totals = getOrderTotals(order);
    expect(totals.isShippingFree).toBe(false);
    expect(totals.shippingSubtotal).toBe(12);
  });

  it("missing tax_total gives hasTaxTotal false", () => {
    const order = {
      id: "ord_3",
      currency_code: "TND",
      subtotal: 50,
      // tax_total missing / undefined
    } as unknown as Order;

    const totals = getOrderTotals(order);
    expect(totals.hasTaxTotal).toBe(false);
    expect(totals.taxTotal).toBeUndefined();
  });

  it("missing total gives undefined", () => {
    const order = {
      id: "ord_4",
      currency_code: "EUR",
      // total missing / undefined
    } as unknown as Order;

    const totals = getOrderTotals(order);
    expect(totals.total).toBeUndefined();
    expect(totals.currency).toBe("EUR");
  });

  it("null order gives safe defaults", () => {
    const totals = getOrderTotals(null);
    expect(totals).toEqual({
      currency: "TND",
      itemsSubtotal: undefined,
      shippingSubtotal: undefined,
      isShippingFree: false,
      taxTotal: undefined,
      hasTaxTotal: false,
      total: undefined,
    });
  });
});

