import { describe, it, expect } from "vitest";
import { validateAddress, getCheckoutTotals } from "@/logic/checkout-validation";
import type { Address, Cart } from "@/logic/types";

describe("checkout-validation", () => {
  describe("validateAddress", () => {
    const validAddress: Address = {
      first_name: "Firas",
      last_name: "Ben Salah",
      address_1: "Avenue Habib Bourguiba",
      city: "Tunis",
      phone: "+216 98 765 432",
      postal_code: "1000",
      country_code: "tn",
    };

    it("passes with valid data", () => {
      const result = validateAddress("firas@example.com", validAddress);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("requires email and essential address fields", () => {
      const emptyAddress: Address = {
        first_name: "",
        last_name: "",
        address_1: "",
        city: "",
        phone: "",
        postal_code: "",
        country_code: "",
      };
      const result = validateAddress("", emptyAddress);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.first_name).toBeDefined();
      expect(result.errors.last_name).toBeDefined();
      expect(result.errors.address_1).toBeDefined();
      expect(result.errors.city).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    });

    it("validates phone format with spaces, dashes, +216 prefix and at least 8 digits", () => {
      expect(
        validateAddress("test@example.com", { ...validAddress, phone: "12345678" }).isValid
      ).toBe(true);
      expect(
        validateAddress("test@example.com", { ...validAddress, phone: "+216 12 345 678" }).isValid
      ).toBe(true);
      expect(
        validateAddress("test@example.com", { ...validAddress, phone: "216-12345678" }).isValid
      ).toBe(true);

      // Invalid phone (fewer than 8 digits)
      const invalidShort = validateAddress("test@example.com", { ...validAddress, phone: "1234567" });
      expect(invalidShort.isValid).toBe(false);
      expect(invalidShort.errors.phone).toBeDefined();

      // Invalid characters
      const invalidChars = validateAddress("test@example.com", { ...validAddress, phone: "abc12345678" });
      expect(invalidChars.isValid).toBe(false);
    });
  });

  describe("getCheckoutTotals", () => {
    it("handles null cart with default values", () => {
      const totals = getCheckoutTotals(null);
      expect(totals.currencyCode).toBe("TND");
      expect(totals.itemsSubtotal).toBe(0);
      expect(totals.shippingSubtotal).toBeUndefined();
      expect(totals.hasShippingSubtotal).toBe(false);
      expect(totals.taxTotal).toBeUndefined();
      expect(totals.hasTaxTotal).toBe(false);
      expect(totals.total).toBe(0);
    });

    it("computes totals correctly from cart", () => {
      const cart: Cart = {
        id: "cart_123",
        email: "test@example.com",
        region_id: "reg_1",
        items: [],
        shipping_total: 10,
        currency_code: "EUR",
        item_subtotal: 150,
        subtotal: 150,
        shipping_subtotal: 10,
        tax_total: 5,
        total: 165,
      };

      const totals = getCheckoutTotals(cart);
      expect(totals.currencyCode).toBe("EUR");
      expect(totals.itemsSubtotal).toBe(150);
      expect(totals.shippingSubtotal).toBe(10);
      expect(totals.hasShippingSubtotal).toBe(true);
      expect(totals.taxTotal).toBe(5);
      expect(totals.hasTaxTotal).toBe(true);
      expect(totals.total).toBe(165);
    });

    it("derives itemsSubtotal when cart item_subtotal is missing", () => {
      const cart: Cart = {
        id: "cart_derived",
        email: "test@example.com",
        region_id: "reg_1",
        items: [],
        shipping_total: 20,
        tax_total: 0,
        currency_code: "TND",
        subtotal: 120,
        shipping_subtotal: 20,
        total: 120,
      };

      const totals = getCheckoutTotals(cart);
      expect(totals.itemsSubtotal).toBe(100);
      expect(totals.shippingSubtotal).toBe(20);
      expect(totals.hasShippingSubtotal).toBe(true);
    });
  });
});

