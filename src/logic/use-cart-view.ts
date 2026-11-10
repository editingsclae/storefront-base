"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import {
  getCartSubtotal,
  getCartItemCount,
  getCartSummaryTotals,
  CartSummaryTotals,
} from "./cart-view";

export function useCartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeItem } = useCart();
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  // Close when route changes
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  // Handle open/close side-effects: body scroll lock and focus management
  useEffect(() => {
    if (isCartOpen) {
      wasOpenRef.current = true;
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Small delay to ensure drawer DOM is mounted before focusing
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    } else if (wasOpenRef.current) {
      // Only after the drawer was open: return focus to the header cart button
      // or the previous element. Doing it on the first render would pull focus
      // to the cart button on every page load.
      wasOpenRef.current = false;
      const cartBtn = document.getElementById("header-cart-button");
      if (cartBtn) {
        cartBtn.focus();
      } else if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    }
  }, [isCartOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  const items = cart?.items || [];
  const currencyCode = cart?.currency_code || "TND";
  const subtotal = getCartSubtotal(cart);
  const itemCount = getCartItemCount(cart);

  const handleUpdateQuantity = async (lineItemId: string, newQty: number) => {
    setLineErrors((prev) => {
      const copy = { ...prev };
      delete copy[lineItemId];
      return copy;
    });
    setBusyLineId(lineItemId);
    try {
      await updateQuantity(lineItemId, newQty);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to update quantity.";
      setLineErrors((prev) => ({ ...prev, [lineItemId]: msg }));
    } finally {
      setBusyLineId(null);
    }
  };

  const handleRemoveItem = async (lineItemId: string) => {
    setLineErrors((prev) => {
      const copy = { ...prev };
      delete copy[lineItemId];
      return copy;
    });
    setBusyLineId(lineItemId);
    try {
      await removeItem(lineItemId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to remove item.";
      setLineErrors((prev) => ({ ...prev, [lineItemId]: msg }));
    } finally {
      setBusyLineId(null);
    }
  };

  return {
    cart,
    isCartOpen,
    closeCart,
    closeButtonRef,
    items,
    currencyCode,
    subtotal,
    itemCount,
    busyLineId,
    lineErrors,
    handleUpdateQuantity,
    handleRemoveItem,
  };
}

export function useCartPage() {
  const { cart, isLoading, updateQuantity, removeItem } = useCart();

  const items = cart?.items || [];
  const currencyCode = cart?.currency_code || "TND";
  const totals: CartSummaryTotals = getCartSummaryTotals(cart);
  const itemCount = items.length;

  return {
    cart,
    isLoading,
    items,
    currencyCode,
    totals,
    itemCount,
    updateQuantity,
    removeItem,
  };
}

