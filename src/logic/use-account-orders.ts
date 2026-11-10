"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getCustomerOrders, Order } from "@/lib/medusa";
import { isUnauthorizedError } from "./auth-401";

export function useAccountOrders() {
  const router = useRouter();
  const {
    customer,
    token,
    logout,
    isLoading: authLoading,
    emailVerified,
  } = useAuth();
  const { clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersVersion, setOrdersVersion] = useState(0);

  useEffect(() => {
    if (!authLoading && !customer && !token) {
      router.push("/account/login");
    }
  }, [customer, token, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    getCustomerOrders(token)
      .then((data) => {
        if (isCurrent) setOrders(data);
      })
      .catch((err) => {
        console.error("Failed to load customer orders:", err);
        if (isUnauthorizedError(err)) {
          clearCart();
          logout();
          router.push("/account/login");
        }
      })
      .finally(() => {
        if (isCurrent) setOrdersLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, ordersVersion, clearCart, logout, router]);

  const reloadOrders = useCallback(() => {
    setOrdersLoading(true);
    setOrdersVersion((v) => v + 1);
  }, []);

  const handleLogout = () => {
    clearCart();
    logout();
  };

  return {
    customer,
    emailVerified,
    authLoading,
    orders,
    ordersLoading,
    reloadOrders,
    handleLogout,
  };
}
