"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  getShippingOptions,
  addShippingMethod,
  updateCart,
  createPaymentCollection,
  createPaymentSession,
  completeCart,
  linkCartToCustomer,
  ShippingOption,
  Address,
} from "@/lib/medusa";
import { rememberGuestOrder } from "@/lib/guest-orders";
import {
  validateAddress,
  getCheckoutTotals,
  CheckoutTotals,
} from "./checkout-validation";

export type CheckoutStep = "address" | "shipping" | "payment";

export function useCheckout() {
  const router = useRouter();
  const { cart, refreshCart, isLoading: cartLoading } = useCart();
  const { customer, token } = useAuth();
  const [, startTransition] = useTransition();

  // Form states
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<Address>({
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "Tunis",
    country_code: "tn",
    postal_code: "1000",
    phone: "",
  });

  // Flow states
  const [step, setStep] = useState<CheckoutStep>("address");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string>("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fetchedShippingCartIdRef = React.useRef<string | null>(null);

  // Autofill customer data if logged in
  useEffect(() => {
    if (!customer) return;
    const timer = setTimeout(() => {
      setEmail((prev) => prev || customer.email || "");
      setAddress((prev) => ({
        ...prev,
        first_name: prev.first_name || customer.first_name || "",
        last_name: prev.last_name || customer.last_name || "",
        phone: prev.phone || customer.phone || "",
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, [customer]);

  const items = cart?.items || [];
  const totals: CheckoutTotals = getCheckoutTotals(cart);
  const currencyCode = totals.currencyCode;

  const updateEmail = (val: string) => {
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const updateAddressField = (field: keyof Address, val: string) => {
    setAddress((prev) => ({ ...prev, [field]: val }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Step 1: Save Address and Load Shipping Options
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart) return;

    const validation = validateAddress(email, address);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return; // Do NOT call the API until valid
    }

    setErrorMessage(null);
    setShippingLoading(true);

    try {
      // 1. Update cart with email and address
      await updateCart(
        cart.id,
        {
          email,
          shipping_address: address,
          billing_address: address,
        },
        token || undefined
      );

      // 2. Fetch shipping options (once per cart)
      if (fetchedShippingCartIdRef.current !== cart.id || shippingOptions.length === 0) {
        const options = await getShippingOptions(cart.id);
        setShippingOptions(options);
        fetchedShippingCartIdRef.current = cart.id;

        if (options.length > 0) {
          setSelectedShippingOptionId(options[0].id);
        }
      }
      await refreshCart();
      setStep("shipping");
    } catch (err: unknown) {
      console.error("Address save error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        msg || "Failed to update shipping address. Please check your details."
      );
    } finally {
      setShippingLoading(false);
    }
  };

  // Step 2: Confirm Shipping Method
  const handleConfirmShipping = async () => {
    if (!cart || !selectedShippingOptionId) return;
    setErrorMessage(null);
    setShippingLoading(true);

    try {
      await addShippingMethod(
        cart.id,
        selectedShippingOptionId,
        token || undefined
      );
      await refreshCart();
      setStep("payment");
    } catch (err: unknown) {
      console.error("Shipping method error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("shipping profile")) {
        setErrorMessage(
          "The cart items require shipping profiles that are not satisfied by the merchant. Please contact store support."
        );
      } else {
        setErrorMessage(msg || "Failed to add shipping method.");
      }
    } finally {
      setShippingLoading(false);
    }
  };

  // Step 3: Complete Order
  const handlePlaceOrder = async () => {
    if (!cart) return;
    setErrorMessage(null);
    setSubmittingOrder(true);

    try {
      // If customer token exists and cart has no customer_id, link cart to customer, then refresh cart
      if (token && cart && !cart.customer_id) {
        try {
          await linkCartToCustomer(cart.id, token);
          await refreshCart();
        } catch (linkErr) {
          console.warn("Pre-order cart link warning:", linkErr);
        }
      }

      // 1. Create payment collection
      const paymentCollection = await createPaymentCollection(
        cart.id,
        token || undefined
      );

      // 2. Create payment session (verified provider: pp_system_default)
      await createPaymentSession(
        paymentCollection.id,
        "pp_system_default",
        token || undefined
      );

      // 3. Complete cart
      const result = await completeCart(cart.id, token || undefined);

      if (result.type === "order" && result.order) {
        const orderId = result.order.id;
        // A guest can claim this order later, when they log in or register
        if (!token) {
          rememberGuestOrder(orderId);
        }
        setOrderPlaced(true);
        startTransition(() => {
          router.push(`/order/confirmed/${orderId}`);
        });
      } else {
        throw new Error("Cart completion did not return an order.");
      }
    } catch (err: unknown) {
      console.error("Place order failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("shipping profile")) {
        setErrorMessage(
          "The cart items require shipping profiles that are not satisfied by the merchant. Please contact store support."
        );
      } else {
        setErrorMessage(
          msg || "An unexpected error occurred while placing your order."
        );
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  const selectedShippingOption = shippingOptions.find(
    (o) => o.id === selectedShippingOptionId
  );

  return {
    cart,
    cartLoading,
    items,
    totals,
    currencyCode,
    customer,
    email,
    setEmail,
    updateEmail,
    address,
    setAddress,
    updateAddressField,
    step,
    setStep,
    shippingOptions,
    selectedShippingOptionId,
    setSelectedShippingOptionId,
    selectedShippingOption,
    shippingLoading,
    submittingOrder,
    orderPlaced,
    errorMessage,
    fieldErrors,
    handleSaveAddress,
    handleConfirmShipping,
    handlePlaceOrder,
  };
}

