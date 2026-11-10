import { Order } from "@/lib/medusa";

export interface OrderTotals {
  currency: string;
  itemsSubtotal: number | undefined;
  shippingSubtotal: number | undefined;
  isShippingFree: boolean;
  taxTotal: number | undefined;
  hasTaxTotal: boolean;
  total: number | undefined;
}

export function getOrderTotals(order: Order | null): OrderTotals {
  const currency = order?.currency_code || "TND";
  const itemsSubtotal =
    order?.item_subtotal ??
    (order?.shipping_subtotal !== undefined
      ? (order?.subtotal !== undefined ? order.subtotal - order.shipping_subtotal : undefined)
      : order?.subtotal);
  const shippingSubtotal = order?.shipping_subtotal;
  const isShippingFree = shippingSubtotal === 0;
  const taxTotal = order?.tax_total;
  const hasTaxTotal = taxTotal !== undefined && taxTotal > 0;
  const total = order?.total;

  return {
    currency,
    itemsSubtotal,
    shippingSubtotal,
    isShippingFree,
    taxTotal,
    hasTaxTotal,
    total,
  };
}

