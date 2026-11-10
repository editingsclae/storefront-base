"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/lib/medusa";
import { useCart } from "@/context/CartContext";
import {
  optionGroups,
  findVariant,
  initialSelection,
  valueState,
  choose,
  showVariantTitle,
  type OptionGroup,
  type Selection,
  type ValueState,
} from "./variant-select";

export interface UseVariantSelectResult {
  // Option groups & selection
  groups: OptionGroup[];
  selection: Selection;
  variants: ProductVariant[];
  selectedVariantId: string;
  selectedVariant: ProductVariant | undefined;

  // Pricing & Stock
  price: ProductVariant["calculated_price"];
  inventory: number | undefined;
  isOutOfStock: boolean;
  canBuy: boolean;

  // Quantity
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  incrementQuantity: () => void;
  decrementQuantity: () => void;
  canIncrement: boolean;
  canDecrement: boolean;

  // Value states & actions
  getValueState: (groupId: string, value: string) => ValueState;
  isValueDisabled: (groupId: string, value: string) => boolean;
  chooseOption: (groupId: string, value: string) => void;
  selectVariant: (variantId: string) => void;
  showVariantTitle: (title: string | undefined | null) => boolean;

  // Cart operations
  handleAddToCart: () => Promise<void>;
  isAdding: boolean;
  cartLoading: boolean;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export function useVariantSelect(product: Product): UseVariantSelectResult {
  const { addToCart, isLoading: cartLoading } = useCart();
  const variants = product.variants || [];

  // One row of buttons per option (Size, Color...).
  // Placeholder option "Default Option" is filtered out by optionGroups.
  const groups = optionGroups(product);

  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(product, groups)
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedVariant =
    groups.length > 0
      ? findVariant(product, groups, selection) || variants[0]
      : variants.find((v) => v.id === selectedVariantId) || variants[0];

  const price = selectedVariant?.calculated_price;
  const inventory = selectedVariant?.inventory_quantity;
  const isOutOfStock = inventory !== undefined && inventory <= 0;
  const canBuy = !isOutOfStock && !!selectedVariant;

  const canDecrement = quantity > 1 && !isOutOfStock;
  const canIncrement =
    !isOutOfStock && (inventory === undefined || quantity < inventory);

  const incrementQuantity = () => {
    setQuantity((prev) =>
      inventory !== undefined ? Math.min(inventory, prev + 1) : prev + 1
    );
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const chooseOption = (groupId: string, value: string) => {
    setSelection(choose(product, groups, selection, groupId, value));
    setQuantity(1);
  };

  const selectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
  };

  const getValueState = (groupId: string, value: string): ValueState => {
    return valueState(product, groups, selection, groupId, value);
  };

  const isValueDisabled = (groupId: string, value: string): boolean => {
    return getValueState(groupId, value) === "gone";
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setIsAdding(true);
    setErrorMessage(null);

    try {
      await addToCart(selectedVariant.id, quantity);
    } catch (err: unknown) {
      console.error("Failed to add to cart:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        msg || "Failed to add product to cart. Please try again."
      );
    } finally {
      setIsAdding(false);
    }
  };

  return {
    groups,
    selection,
    variants,
    selectedVariantId,
    selectedVariant,
    price,
    inventory,
    isOutOfStock,
    canBuy,
    quantity,
    setQuantity,
    incrementQuantity,
    decrementQuantity,
    canIncrement,
    canDecrement,
    getValueState,
    isValueDisabled,
    chooseOption,
    selectVariant,
    showVariantTitle,
    handleAddToCart,
    isAdding,
    cartLoading,
    errorMessage,
    setErrorMessage,
  };
}

