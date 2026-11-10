"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getOrder, Order } from "@/lib/medusa";
import { isUnauthorizedError } from "./auth-401";

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

export function useOrderDetails(id: string) {
  const router = useRouter();
  const { customer, token, logout, isLoading: authLoading } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !customer && !token) {
      router.push("/account/login");
    }
  }, [customer, token, authLoading, router]);

  useEffect(() => {
    if (!token || !id) return;
    let isCurrent = true;

    getOrder(id, token)
      .then((ord) => {
        if (!isCurrent) return;
        if (ord) {
          setOrder(ord);
        } else {
          setError("Order not found or does not belong to this merchant.");
        }
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        console.error("Order load error:", err);
        if (isUnauthorizedError(err)) {
          clearCart();
          logout();
          router.push("/account/login");
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load order details from backend.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, id, clearCart, logout, router]);

  const items = order?.items || [];
  const totals = getOrderTotals(order);

  return {
    order,
    items,
    totals,
    loading: authLoading || loading,
    error,
  };
}

