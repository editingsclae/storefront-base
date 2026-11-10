import { describe, it, expect } from "vitest";
import {
  optionGroups,
  findVariant,
  initialSelection,
  valueState,
  choose,
  priceRange,
  showVariantTitle,
} from "@/logic/variant-select";
import type { Product } from "@/logic/types";

describe("variant-select", () => {
  const shirtProduct: Product = {
    id: "prod_shirt",
    title: "Oxford Shirt",
    handle: "oxford-shirt",
    options: [
      {
        id: "opt_color",
        title: "Color",
        values: [{ id: "v_white", value: "White" }, { id: "v_blue", value: "Blue" }],
      },
      {
        id: "opt_size",
        title: "Size",
        values: [{ id: "v_s", value: "S" }, { id: "v_m", value: "M" }, { id: "v_l", value: "L" }],
      },
    ],
    variants: [
      {
        id: "var_white_s",
        title: "White / S",
        inventory_quantity: 3,
        calculated_price: { calculated_amount: 50, original_amount: 50, currency_code: "TND" },
        options: [
          { id: "1", option_id: "opt_color", value: "White" },
          { id: "2", option_id: "opt_size", value: "S" },
        ],
      },
      {
        id: "var_white_m",
        title: "White / M",
        inventory_quantity: 0, // sold out
        calculated_price: { calculated_amount: 50, original_amount: 50, currency_code: "TND" },
        options: [
          { id: "3", option_id: "opt_color", value: "White" },
          { id: "4", option_id: "opt_size", value: "M" },
        ],
      },
      // Note: White / L does NOT exist at all
      {
        id: "var_blue_s",
        title: "Blue / S",
        inventory_quantity: 2,
        calculated_price: { calculated_amount: 55, original_amount: 55, currency_code: "TND" },
        options: [
          { id: "5", option_id: "opt_color", value: "Blue" },
          { id: "6", option_id: "opt_size", value: "S" },
        ],
      },
      {
        id: "var_blue_m",
        title: "Blue / M",
        inventory_quantity: 5,
        calculated_price: { calculated_amount: 55, original_amount: 55, currency_code: "TND" },
        options: [
          { id: "7", option_id: "opt_color", value: "Blue" },
          { id: "8", option_id: "opt_size", value: "M" },
        ],
      },
      {
        id: "var_blue_l",
        title: "Blue / L",
        inventory_quantity: 0, // sold out
        calculated_price: { calculated_amount: 60, original_amount: 60, currency_code: "TND" },
        options: [
          { id: "9", option_id: "opt_color", value: "Blue" },
          { id: "10", option_id: "opt_size", value: "L" },
        ],
      },
    ],
  };

  const singleVariantDefaultProduct: Product = {
    id: "prod_simple",
    title: "Simple Cap",
    handle: "simple-cap",
    options: [
      {
        id: "opt_def",
        title: "Default Option",
        values: [{ id: "val_def", value: "Default Option Value" }],
      },
    ],
    variants: [
      {
        id: "var_def",
        title: "Default Variant",
        inventory_quantity: 10,
        calculated_price: { calculated_amount: 25, original_amount: 25, currency_code: "TND" },
        options: [{ id: "1", option_id: "opt_def", value: "Default Option Value" }],
      },
    ],
  };

  describe("optionGroups", () => {
    it("returns empty array for products with single variant", () => {
      expect(optionGroups(singleVariantDefaultProduct)).toEqual([]);
    });

    it("hides 'Default Option'", () => {
      const prodWithTwoVariantsDefaultOpt: Product = {
        ...singleVariantDefaultProduct,
        variants: [
          { id: "v1", title: "v1", inventory_quantity: 1 },
          { id: "v2", title: "v2", inventory_quantity: 2 },
        ],
      };
      expect(optionGroups(prodWithTwoVariantsDefaultOpt)).toEqual([]);
    });

    it("returns valid option groups with only used values in order", () => {
      const groups = optionGroups(shirtProduct);
      expect(groups).toHaveLength(2);
      expect(groups[0]).toEqual({
        id: "opt_color",
        title: "Color",
        values: ["White", "Blue"],
      });
      expect(groups[1]).toEqual({
        id: "opt_size",
        title: "Size",
        values: ["S", "M", "L"],
      });
    });
  });

  describe("initialSelection", () => {
    it("selects the first in-stock variant", () => {
      const groups = optionGroups(shirtProduct);
      const sel = initialSelection(shirtProduct, groups);
      expect(sel).toEqual({
        opt_color: "White",
        opt_size: "S",
      });
    });

    it("falls back to the first variant if none are in stock", () => {
      const soldOutProduct: Product = {
        ...shirtProduct,
        variants: shirtProduct.variants?.map((v) => ({ ...v, inventory_quantity: 0 })),
      };
      const groups = optionGroups(soldOutProduct);
      const sel = initialSelection(soldOutProduct, groups);
      expect(sel).toEqual({
        opt_color: "White",
        opt_size: "S",
      });
    });
  });

  describe("findVariant", () => {
    it("finds the variant matching exact selection", () => {
      const groups = optionGroups(shirtProduct);
      const variant = findVariant(shirtProduct, groups, { opt_color: "Blue", opt_size: "M" });
      expect(variant?.id).toBe("var_blue_m");
    });

    it("returns undefined when combination does not exist", () => {
      const groups = optionGroups(shirtProduct);
      const variant = findVariant(shirtProduct, groups, { opt_color: "White", opt_size: "L" });
      expect(variant).toBeUndefined();
    });
  });

  describe("valueState", () => {
    it("reports 'available' when combination exists and is in stock", () => {
      const groups = optionGroups(shirtProduct);
      const sel = { opt_color: "White", opt_size: "S" };
      // Blue is in stock for size S
      const state = valueState(shirtProduct, groups, sel, "opt_color", "Blue");
      expect(state).toBe("available");
    });

    it("reports 'unavailable' when combination is sold out or does not exist, but value has stock elsewhere", () => {
      const groups = optionGroups(shirtProduct);
      const sel = { opt_color: "White", opt_size: "S" };
      // White / M is sold out, but M is available in Blue
      const stateM = valueState(shirtProduct, groups, sel, "opt_size", "M");
      expect(stateM).toBe("unavailable");

      // White / L does not exist, but L has variants in the product (though sold out in Blue)
    });

    it("reports 'gone' when no variant with this value can be bought at all", () => {
      const groups = optionGroups(shirtProduct);
      const sel = { opt_color: "White", opt_size: "S" };
      // Size L only exists in Blue and has 0 stock -> totally out of stock
      const stateL = valueState(shirtProduct, groups, sel, "opt_size", "L");
      expect(stateL).toBe("gone");
    });
  });

  describe("choose", () => {
    it("switches to the requested value when available for current other choices", () => {
      const groups = optionGroups(shirtProduct);
      const current = { opt_color: "White", opt_size: "S" };
      const next = choose(shirtProduct, groups, current, "opt_color", "Blue");
      expect(next).toEqual({ opt_color: "Blue", opt_size: "S" });
    });

    it("adjusts other options to the closest available variant when the exact combo cannot be bought", () => {
      const groups = optionGroups(shirtProduct);
      // Start with White / S
      // Click M: White / M is sold out!
      // In-stock M candidates: Blue / M
      const current = { opt_color: "White", opt_size: "S" };
      const next = choose(shirtProduct, groups, current, "opt_size", "M");
      expect(next).toEqual({ opt_color: "Blue", opt_size: "M" });
    });

    it("returns current selection unchanged if no in-stock candidates exist for chosen value", () => {
      const groups = optionGroups(shirtProduct);
      const current = { opt_color: "White", opt_size: "S" };
      // Size L is completely out of stock across all colors
      const next = choose(shirtProduct, groups, current, "opt_size", "L");
      expect(next).toEqual(current);
    });
  });

  describe("priceRange & showVariantTitle", () => {
    it("computes low and high price bounds when variants differ", () => {
      const range = priceRange(shirtProduct.variants || []);
      expect(range).toEqual({ low: 50, high: 60, currency: "TND" });
    });

    it("identifies placeholder variant titles to hide", () => {
      expect(showVariantTitle("Default")).toBe(false);
      expect(showVariantTitle("Default Variant")).toBe(false);
      expect(showVariantTitle("Default Option")).toBe(false);
      expect(showVariantTitle(null)).toBe(false);
      expect(showVariantTitle("")).toBe(false);
      expect(showVariantTitle("Small / Red")).toBe(true);
    });
  });
});

