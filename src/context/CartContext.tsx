"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Cart,
  getCart,
  createCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  linkCartToCustomer,
} from "@/lib/medusa";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: string, quantity?: number) => Promise<Cart>;
  updateQuantity: (lineItemId: string, quantity: number) => Promise<Cart>;
  removeItem: (lineItemId: string) => Promise<Cart>;
  refreshCart: () => Promise<Cart | null>;
  clearCart: () => void;
  ensureCart: () => Promise<Cart>;
  linkCustomerToCart: (overrideToken?: string) => Promise<Cart | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "medusa_cart_id";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { token } = useAuth();

  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const setCartId = (id: string | null) => {
    if (id) {
      localStorage.setItem(CART_KEY, id);
      document.cookie = `${CART_KEY}=${id}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem(CART_KEY);
      document.cookie = `${CART_KEY}=; path=/; max-age=0`;
    }
  };

  const getSavedCartId = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CART_KEY);
  };

  const ensureCart = useCallback(async (): Promise<Cart> => {
    const requestToken = token;
    const savedId = getSavedCartId();
    if (savedId) {
      try {
        const existing = await getCart(savedId, requestToken || undefined);
        if (tokenRef.current !== requestToken) {
          if (existing && !existing.items) existing.items = [];
          return existing || (await createCart(tokenRef.current || undefined));
        }
        if (existing && !existing.items) {
          existing.items = [];
        }
        if (existing) {
          setCart(existing);
          return existing;
        }
      } catch (err) {
        console.warn("Stored cart invalid or gone, recreating...", err);
      }
    }

    if (tokenRef.current !== requestToken) {
      return await createCart(tokenRef.current || undefined);
    }

    // Recreate fresh cart
    const fresh = await createCart(tokenRef.current || undefined);
    if (tokenRef.current !== requestToken) return fresh;
    setCartId(fresh.id);
    setCart(fresh);
    return fresh;
  }, [token]);

  const refreshCart = useCallback(async (): Promise<Cart | null> => {
    const requestToken = token;
    const savedId = getSavedCartId();
    if (!savedId) return null;
    try {
      const refreshed = await getCart(savedId, requestToken || undefined);
      if (tokenRef.current !== requestToken) return null;
      if (refreshed) {
        setCart(refreshed);
        return refreshed;
      } else {
        setCartId(null);
        setCart(null);
        return null;
      }
    } catch {
      if (tokenRef.current !== requestToken) return null;
      setCartId(null);
      setCart(null);
      return null;
    }
  }, [token]);

  // Load cart on initial mount
  useEffect(() => {
    let isCurrent = true;
    const requestToken = token;
    const init = async () => {
      setIsLoading(true);
      try {
        const savedId = getSavedCartId();
        if (savedId) {
          const loaded = await getCart(savedId, requestToken || undefined);
          if (!isCurrent) return;
          if (tokenRef.current !== requestToken) return;
          if (loaded) {
            setCart(loaded);
          } else {
            setCartId(null);
            setCart(null);
          }
        } else {
          if (!isCurrent) return;
          setCart(null);
        }
      } catch (err) {
        if (!isCurrent) return;
        console.warn("Failed to load initial cart:", err);
        setCartId(null);
        setCart(null);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };
    init();
    return () => {
      isCurrent = false;
    };
  }, [token]);

  // Clear cart in state and storage if token was cleared (logout)
  const prevTokenRef = useRef(token);
  useEffect(() => {
    if (prevTokenRef.current && !token) {
      setCartId(null);
      setCart(null);
    }
    prevTokenRef.current = token;
  }, [token]);

  // Link guest cart to customer whenever token becomes available
  useEffect(() => {
    if (!token || !cart?.id || cart.customer_id) return;
    let isCurrent = true;
    const requestToken = token;
    linkCartToCustomer(cart.id, requestToken)
      .then((linked) => {
        if (!isCurrent) return;
        if (tokenRef.current !== requestToken) return;
        setCart(linked);
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.warn("Failed to auto-link cart to customer:", err);
      });
    return () => {
      isCurrent = false;
    };
  }, [token, cart?.id, cart?.customer_id]);

  const addToCart = async (
    variantId: string,
    quantity = 1
  ): Promise<Cart> => {
    setIsLoading(true);
    try {
      const activeCart = cart || (await ensureCart());
      const updated = await apiAddToCart(
        activeCart.id,
        variantId,
        quantity,
        token || undefined
      );
      setCart(updated);
      setCartId(updated.id);
      setIsCartOpen(true);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (
    lineItemId: string,
    quantity: number
  ): Promise<Cart> => {
    if (!cart) throw new Error("No active cart");
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        return await removeItem(lineItemId);
      }
      const updated = await apiUpdateCartItem(
        cart.id,
        lineItemId,
        quantity,
        token || undefined
      );
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (lineItemId: string): Promise<Cart> => {
    if (!cart) throw new Error("No active cart");
    setIsLoading(true);
    try {
      const updated = await apiRemoveCartItem(
        cart.id,
        lineItemId,
        token || undefined
      );
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setCartId(null);
    setCart(null);
  };

  const linkCustomerToCart = useCallback(
    async (overrideToken?: string): Promise<Cart | null> => {
      const activeToken = overrideToken || token;
      if (!activeToken) return cart;
      const targetCart = cart || (await refreshCart());
      if (targetCart && !targetCart.customer_id) {
        try {
          const linked = await linkCartToCustomer(targetCart.id, activeToken);
          if (tokenRef.current !== activeToken) return cart;
          setCart(linked);
          return linked;
        } catch (err) {
          console.warn("Failed linking cart to customer:", err);
        }
      }
      return cart;
    },
    [token, cart, refreshCart]
  );

  const itemCount =
    cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        refreshCart,
        clearCart,
        ensureCart,
        linkCustomerToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
