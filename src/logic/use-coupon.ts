"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  couponErrorMessage,
  getAppliedCoupons,
  normalizeCouponInput,
} from "./coupon";

// The state of the coupon box in the cart and at checkout
export function useCouponBox() {
  const { cart, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applied = getAppliedCoupons(cart);

  const apply = async () => {
    const clean = normalizeCouponInput(code);
    if (!clean) {
      setError("Enter a code.");
      return;
    }
    if (applied.includes(clean)) {
      setError("This code is already applied.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await applyCoupon(clean);
      // A code the backend did not keep is not valid for this store
      if (!getAppliedCoupons(updated).includes(clean)) {
        setError("This code is not valid.");
        return;
      }
      setCode("");
    } catch (err) {
      setError(couponErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (appliedCode: string) => {
    setBusy(true);
    setError(null);
    try {
      await removeCoupon(appliedCode);
    } catch (err) {
      setError(couponErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return {
    code,
    setCode,
    busy,
    error,
    applied,
    canApply: !busy && normalizeCouponInput(code).length > 0,
    apply,
    remove,
  };
}
