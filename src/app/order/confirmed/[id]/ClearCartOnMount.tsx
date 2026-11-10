"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";

interface ClearCartOnMountProps {
  orderId: string;
}

export function ClearCartOnMount({ orderId }: ClearCartOnMountProps) {
  const { clearCart } = useCart();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    try {
      const lastPlaced = sessionStorage.getItem("last_placed_order_id");
      if (lastPlaced === orderId) {
        clearCart();
        sessionStorage.removeItem("last_placed_order_id");
      }
    } catch (e) {
      console.warn("Could not access sessionStorage in ClearCartOnMount:", e);
    }
  }, [clearCart, orderId]);

  return null;
}

