import { Address, Cart } from "@/lib/medusa";

export interface AddressValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateAddress(email: string, address: Address): AddressValidationResult {
  const errors: Record<string, string> = {};

  if (!email.trim()) {
    errors.email = "Email address is required.";
  }

  if (!address.first_name.trim()) {
    errors.first_name = "First name is required.";
  }

  if (!address.last_name.trim()) {
    errors.last_name = "Last name is required.";
  }

  if (!address.address_1.trim()) {
    errors.address_1 = "Address is required.";
  }

  // City is required
  if (!address.city || !address.city.trim()) {
    errors.city = "City is required.";
  }

  // Phone is required: at least 8 digits, allow +216 prefix, spaces ignored
  const rawPhone = address.phone || "";
  const cleanPhone = rawPhone.replace(/[\s\-()]/g, "");
  const phonePattern = /^(\+?216)?[0-9]{8,}$/;
  if (!rawPhone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!phonePattern.test(cleanPhone)) {
    errors.phone = "Phone number must have at least 8 digits (e.g. 12 345 678 or +216 12 345 678).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface CheckoutTotals {
  currencyCode: string;
  itemsSubtotal: number;
  shippingSubtotal: number | undefined;
  hasShippingSubtotal: boolean;
  taxTotal: number | undefined;
  hasTaxTotal: boolean;
  total: number;
}

export function getCheckoutTotals(cart: Cart | null): CheckoutTotals {
  const currencyCode = cart?.currency_code || "TND";
  const itemsSubtotal =
    cart?.item_subtotal ??
    (cart?.shipping_subtotal
      ? (cart?.subtotal ?? 0) - cart.shipping_subtotal
      : (cart?.subtotal ?? 0));
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

