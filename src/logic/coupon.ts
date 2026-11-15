// Coupon codes in the cart: what to show and what to say. No React here.
import type { Cart } from "@/lib/medusa";

// Codes are made of capital letters, numbers, - and _. A shopper may type small letters
// or leave a space around it.
export function normalizeCouponInput(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function getAppliedCoupons(cart: Pick<Cart, "promotions"> | null): string[] {
  const codes = (cart?.promotions || [])
    .map((p) => (p?.code || "").trim())
    .filter(Boolean);
  return Array.from(new Set<string>(codes));
}

// The money a coupon takes off, never below 0
export function getDiscountTotal(
  source: { discount_total?: number } | null
): number {
  const value = Number(source?.discount_total);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// What to tell the shopper when a code is refused. The backend's own words are kept when
// they are about the order (a minimum, for example), because they say what to do.
export function couponErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (/at least|minimum/i.test(message)) return message;
  if (/invalid|not found|expired|does not exist/i.test(message)) {
    return "This code is not valid.";
  }
  return "We could not apply this code. Please try again.";
}
