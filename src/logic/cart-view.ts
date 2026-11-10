import { Cart, LineItem } from "@/lib/medusa";
import { showVariantTitle } from "./variant-select";

export { showVariantTitle };

export interface CartLineItemState {
  isBusy: boolean;
  lineTotal: number;
  error?: string;
  canDecrease: boolean;
  canIncrease: boolean;
  showVariant: boolean;
}

export function getCartLineItemTotal(
  item: Pick<LineItem, "subtotal" | "unit_price" | "quantity">
): number {
  return item.subtotal || item.unit_price * item.quantity;
}

export function getCartSubtotal(cart: Cart | null): number {
  return cart?.item_subtotal ?? cart?.subtotal ?? 0;
}

export function isCartEmpty(cart: Cart | null): boolean {
  return !cart || !cart.items || cart.items.length === 0;
}

export function getCartItemCount(cart: Cart | null): number {
  return (cart?.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
}

export interface CartSummaryTotals {
  currencyCode: string;
  itemsSubtotal: number;
  shippingSubtotal: number | undefined;
  hasShippingSubtotal: boolean;
  taxTotal: number | undefined;
  hasTaxTotal: boolean;
  total: number;
}

export function getCartSummaryTotals(cart: Cart | null): CartSummaryTotals {
  const currencyCode = cart?.currency_code || "TND";
  const itemsSubtotal = cart?.item_subtotal ?? cart?.subtotal ?? 0;
  const shippingSubtotal = cart?.shipping_subtotal;
  const hasShippingSubtotal =
    shippingSubtotal !== undefined && shippingSubtotal > 0;
  const taxTotal = cart?.tax_total;
  const hasTaxTotal = taxTotal !== undefined && taxTotal > 0;
  const total = cart?.total || cart?.subtotal || 0;

  return {
    currencyCode,
    itemsSubtotal,
    shippingSubtotal,
    hasShippingSubtotal,
    taxTotal,
    hasTaxTotal,
    total,
  };
}

export function getLineItemState(
  item: LineItem,
  busyLineId: string | null = null,
  lineErrors: Record<string, string> = {}
): CartLineItemState {
  const isBusy = busyLineId === item.id;
  const lineTotal = getCartLineItemTotal(item);
  const error = lineErrors[item.id];
  const canDecrease = !isBusy && item.quantity > 1;
  const canIncrease = !isBusy;
  const showVariant = showVariantTitle(item.variant_title);

  return {
    isBusy,
    lineTotal,
    error,
    canDecrease,
    canIncrease,
    showVariant,
  };
}
