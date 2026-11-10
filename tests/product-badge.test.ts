import { describe, it, expect } from "vitest";
import { productBadge, MAX_BADGE_LENGTH } from "@/lib/product-badge";

describe("product-badge", () => {
  it("returns trimmed text for a valid badge <= 16 characters", () => {
    expect(productBadge({ metadata: { badge: "Sale" } })).toBe("Sale");
    expect(productBadge({ metadata: { badge: "  New Arrival  " } })).toBe("New Arrival");
    expect(productBadge({ metadata: { badge: "1234567890123456" } })).toBe("1234567890123456");
  });

  it("returns empty string when badge is empty or only whitespace", () => {
    expect(productBadge({ metadata: { badge: "" } })).toBe("");
    expect(productBadge({ metadata: { badge: "   " } })).toBe("");
  });

  it("returns empty string when badge exceeds MAX_BADGE_LENGTH (16 chars)", () => {
    expect(MAX_BADGE_LENGTH).toBe(16);
    expect(
      productBadge({
        metadata: { badge: "This badge is way too long to display" },
      })
    ).toBe("");
    expect(
      productBadge({
        metadata: { badge: "12345678901234567" }, // 17 chars
      })
    ).toBe("");
  });

  it("returns empty string when metadata is non-string, missing, null or undefined", () => {
    expect(productBadge(null)).toBe("");
    expect(productBadge(undefined)).toBe("");
    expect(productBadge({})).toBe("");
    expect(productBadge({ metadata: null })).toBe("");
    expect(productBadge({ metadata: { badge: 12345 } })).toBe("");
    expect(productBadge({ metadata: { badge: true } })).toBe("");
    expect(productBadge({ metadata: { badge: { label: "Sale" } } })).toBe("");
    expect(productBadge({ metadata: { other: "field" } })).toBe("");
  });
});

