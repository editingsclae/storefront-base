"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";

export function ClearCartOnMount() {
  const { clearCart } = useCart();
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

  return null;
}

