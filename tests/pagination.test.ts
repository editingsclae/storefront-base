import { describe, it, expect } from "vitest";
import {
  pageCount,
  parsePage,
  pageSlice,
  pageItems,
} from "@/lib/pagination";

describe("pagination", () => {
  describe("pageCount", () => {
    it("computes page count with default and custom perPage", () => {
      expect(pageCount(0)).toBe(1);
      expect(pageCount(15)).toBe(1);
      expect(pageCount(16)).toBe(2);
      expect(pageCount(45, 10)).toBe(5);
    });
  });

  describe("parsePage", () => {
    it("falls back to 1 for invalid or empty inputs", () => {
      expect(parsePage(null, 5)).toBe(1);
      expect(parsePage(undefined, 5)).toBe(1);
      expect(parsePage("", 5)).toBe(1);
      expect(parsePage("0", 5)).toBe(1);
      expect(parsePage("-4", 5)).toBe(1);
      expect(parsePage("abc", 5)).toBe(1);
      expect(parsePage("1.5", 5)).toBe(1);
    });

    it("clamps out-of-range page numbers past the end to totalPages", () => {
      expect(parsePage("10", 3)).toBe(3);
      expect(parsePage("999", 5)).toBe(5);
    });

    it("accepts valid page number within bounds", () => {
      expect(parsePage("2", 5)).toBe(2);
      expect(parsePage("5", 5)).toBe(5);
    });
  });

  describe("pageSlice", () => {
    const items = Array.from({ length: 40 }, (_, i) => `item_${i + 1}`);

    it("returns the slice for page 1", () => {
      const slice = pageSlice(items, 1, 10);
      expect(slice).toHaveLength(10);
      expect(slice[0]).toBe("item_1");
      expect(slice[9]).toBe("item_10");
    });

    it("returns the slice for subsequent pages", () => {
      const slice = pageSlice(items, 4, 10);
      expect(slice).toHaveLength(10);
      expect(slice[0]).toBe("item_31");
      expect(slice[9]).toBe("item_40");
    });
  });

  describe("pageItems", () => {
    it("returns [1] when total pages is 1", () => {
      expect(pageItems(1, 1)).toEqual([1]);
    });

    it("shows all pages when total pages is small", () => {
      expect(pageItems(1, 4)).toEqual([1, 2, 3, 4]);
      expect(pageItems(2, 4)).toEqual([1, 2, 3, 4]);
    });

    it("includes gaps (gap-start / gap-end) for large page ranges", () => {
      // Current at start: 1, 2, gap-end, 10
      expect(pageItems(1, 10)).toEqual([1, 2, "gap-end", 10]);

      // Current in middle: 1, gap-start, 4, 5, 6, gap-end, 10
      expect(pageItems(5, 10)).toEqual([1, "gap-start", 4, 5, 6, "gap-end", 10]);

      // Current at end: 1, gap-start, 9, 10
      expect(pageItems(10, 10)).toEqual([1, "gap-start", 9, 10]);
    });

    it("replaces single-page gap with the actual page number", () => {
      // When page difference is 2 (e.g. between 1 and 3, page 2 is missing):
      // Wanted: [1, 10, 2, 3, 4] -> sorted: 1, 2, 3, 4 ...
      // For current = 3, total = 6:
      // Wanted: [1, 6, 2, 3, 4] -> [1, 2, 3, 4, gap-end, 6] (or 5 if diff is 2)
      // 6 - 4 = 2, so 5 is inserted instead of gap!
      expect(pageItems(3, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});

