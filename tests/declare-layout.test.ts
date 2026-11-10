import { describe, it, expect } from "vitest";
import {
  visibleSections,
  visiblePromoBanners,
  LAYOUT,
  CATEGORY_TILE_PLACES,
  SectionPlace,
} from "@/lib/declare-layout";

describe("declare-layout", () => {
  describe("visibleSections", () => {
    const customPlaces: SectionPlace[] = [
      { key: "best_sellers", count: 3 },
      { key: "new_arrivals", count: 2 },
      { key: "trending", count: 4 },
    ];

    const backendSections = [
      {
        key: "new_arrivals",
        product_ids: ["p1", "p2", "p3", "p4", "p5"],
      },
      {
        key: "unknown_section",
        product_ids: ["u1", "u2"],
      },
      {
        key: "best_sellers",
        product_ids: ["b1", "b2", "b3", "b4"],
      },
      {
        key: "trending",
        product_ids: [], // empty products list
      },
    ];

    it("respects declared order and declared keys only", () => {
      const result = visibleSections(backendSections, customPlaces);
      // customPlaces specifies: best_sellers first, then new_arrivals, then trending
      // unknown_section must not be included
      expect(result.map((s) => s.key)).toEqual(["best_sellers", "new_arrivals"]);
    });

    it("cuts product_ids to the declared count cutoff", () => {
      const result = visibleSections(backendSections, customPlaces);
      const bestSellers = result.find((s) => s.key === "best_sellers");
      expect(bestSellers?.product_ids).toEqual(["b1", "b2", "b3"]);

      const newArrivals = result.find((s) => s.key === "new_arrivals");
      expect(newArrivals?.product_ids).toEqual(["p1", "p2"]);
    });

    it("drops empty rows (when product_ids is empty)", () => {
      const result = visibleSections(backendSections, customPlaces);
      // trending had 0 product_ids, so it was dropped
      expect(result.find((s) => s.key === "trending")).toBeUndefined();
    });
  });

  describe("visiblePromoBanners", () => {
    it("limits banners to declared places", () => {
      const banners = ["banner1", "banner2", "banner3", "banner4"];
      const visible = visiblePromoBanners(banners, 2);
      expect(visible).toEqual(["banner1", "banner2"]);
    });

    it("uses default LAYOUT.promo_banners", () => {
      const banners = ["b1", "b2", "b3"];
      const visible = visiblePromoBanners(banners);
      expect(visible).toHaveLength(LAYOUT.promo_banners);
    });

    it("handles fewer banners than places gracefully", () => {
      const banners = ["b1"];
      const visible = visiblePromoBanners(banners, 4);
      expect(visible).toEqual(["b1"]);
    });
  });

  describe("CATEGORY_TILE_PLACES constant", () => {
    it("defines 8 places matching the home page design", () => {
      expect(CATEGORY_TILE_PLACES).toBe(8);
    });
  });
});

