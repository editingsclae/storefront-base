import { describe, it, expect } from "vitest";
import {
  couponErrorMessage,
  isCouponProblem,
  getAppliedCoupons,
  getDiscountTotal,
  normalizeCouponInput,
} from "@/logic/coupon";
import { getCartSummaryTotals } from "@/logic/cart-view";
import { getCheckoutTotals } from "@/logic/checkout-validation";
import { getOrderTotals } from "@/logic/order-totals";
import type { Cart, Order } from "@/logic/types";

describe("normalizeCouponInput", () => {
  it("takes out spaces and uses capital letters", () => {
    expect(normalizeCouponInput("  welcome 10 ")).toBe("WELCOME10");
    expect(normalizeCouponInput("save-5_x")).toBe("SAVE-5_X");
  });
});

describe("getAppliedCoupons", () => {
  it("lists the codes once, and none for an empty cart", () => {
    const cart = {
      promotions: [{ id: "p1", code: "WELCOME10" }, { id: "p2", code: "WELCOME10" }, { id: "p3" }],
    } as unknown as Cart;
    expect(getAppliedCoupons(cart)).toEqual(["WELCOME10"]);
    expect(getAppliedCoupons(null)).toEqual([]);
    expect(getAppliedCoupons({} as Cart)).toEqual([]);
  });
});

describe("getDiscountTotal", () => {
  it("is the money taken off, never below zero", () => {
    expect(getDiscountTotal({ discount_total: 12.5 })).toBe(12.5);
    expect(getDiscountTotal({ discount_total: -3 })).toBe(0);
    expect(getDiscountTotal({})).toBe(0);
    expect(getDiscountTotal(null)).toBe(0);
  });
});

describe("isCouponProblem", () => {
  it("knows a problem that is about the coupon", () => {
    expect(isCouponProblem("This coupon needs an order of at least 100.00 TND.")).toBe(true);
    expect(isCouponProblem("Promotion usage limit exceeded")).toBe(true);
  });

  it("leaves other order problems alone", () => {
    expect(isCouponProblem("The cart items require shipping profiles")).toBe(false);
    expect(isCouponProblem("")).toBe(false);
  });
});

describe("couponErrorMessage", () => {
  it("keeps what the shop says about a minimum order", () => {
    const err = new Error("WELCOME10: This coupon needs an order of at least 100.00 TND.");
    expect(couponErrorMessage(err)).toBe(err.message);
  });

  it("asks a guest to sign in for a one-use-per-customer coupon", () => {
    const err = new Error('Attribute value for "customer_id" is required by promotion campaing budget');
    expect(couponErrorMessage(err)).toBe("Sign in to your account to use this coupon.");
  });

  it("says the code is not valid when it is refused", () => {
    expect(couponErrorMessage(new Error("The promotion code NOPE is invalid"))).toBe("This code is not valid.");
  });

  it("falls back to a plain sentence", () => {
    expect(couponErrorMessage(new Error("boom"))).toBe("We could not apply this code. Please try again.");
    expect(couponErrorMessage("x")).toBe("We could not apply this code. Please try again.");
  });
});

describe("totals with a coupon", () => {
  it("show the discount in the cart and at checkout", () => {
    const cart = {
      currency_code: "TND",
      item_subtotal: 100,
      subtotal: 100,
      discount_total: 10,
      total: 90,
    } as unknown as Cart;
    expect(getCartSummaryTotals(cart)).toMatchObject({ discountTotal: 10, hasDiscountTotal: true, total: 90 });
    expect(getCheckoutTotals(cart)).toMatchObject({ discountTotal: 10, hasDiscountTotal: true, total: 90 });
  });

  it("show no discount line without a coupon", () => {
    const cart = { currency_code: "TND", item_subtotal: 100, subtotal: 100, total: 100 } as unknown as Cart;
    expect(getCartSummaryTotals(cart).hasDiscountTotal).toBe(false);
    expect(getCheckoutTotals(cart).hasDiscountTotal).toBe(false);
  });

  it("show the discount on an order", () => {
    const order = { currency_code: "TND", item_subtotal: 100, discount_total: 10, total: 90 } as unknown as Order;
    expect(getOrderTotals(order)).toMatchObject({ discountTotal: 10, hasDiscountTotal: true });
    expect(getOrderTotals(null).hasDiscountTotal).toBe(false);
  });
});
