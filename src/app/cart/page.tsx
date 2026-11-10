"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/logic";
import { getLineItemState } from "@/logic/cart-view";
import { useCartPage } from "@/logic/use-cart-view";
import { Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";

export default function CartPage() {
  const {
    cart,
    isLoading,
    items,
    currencyCode,
    totals,
    itemCount,
    updateQuantity,
    removeItem,
  } = useCartPage();

  if (isLoading && !cart) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 font-medium">Loading your shopping cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center border border-dashed border-zinc-200 rounded-xl space-y-4">
        <ShoppingBag size={48} className="mx-auto text-zinc-400" />
        <h1 className="text-xl font-bold text-zinc-900">Your cart is empty</h1>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          You have no items in your cart. Discover our selection and start shopping.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-md bg-zinc-900 text-white hover:bg-black transition"
          >
            <span>Start Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-zinc-200 pb-4 flex items-baseline justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          Shopping Cart
        </h1>
        <span className="text-xs font-mono text-zinc-500">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Line Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const lineState = getLineItemState(item);

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-lg border border-zinc-200 bg-white"
              >
                {/* Item Thumbnail */}
                <div className="relative w-20 h-20 bg-zinc-100 rounded-md overflow-hidden shrink-0 border border-zinc-100 flex items-center justify-center">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <Package size={24} className="text-zinc-400" />
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-900">
                        {item.title}
                      </h3>
                      {lineState.showVariant && (
                        <p className="text-xs text-zinc-500">{item.variant_title}</p>
                      )}
                      <p className="text-xs font-mono text-zinc-600 mt-0.5">
                        {formatPrice(item.unit_price, currencyCode)} each
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 transition"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-zinc-300 rounded bg-zinc-50 text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-zinc-700 hover:bg-zinc-200 font-bold transition"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-semibold min-w-8 text-center bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-zinc-700 hover:bg-zinc-200 font-bold transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-sm font-bold text-zinc-900">
                      {formatPrice(lineState.lineTotal, currencyCode)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Box */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-zinc-50 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
            Order Summary
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Items</span>
              <span className="font-semibold font-mono text-zinc-900">
                {formatPrice(totals.itemsSubtotal, currencyCode)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-600">
              <span>Shipping</span>
              <span className="font-mono text-zinc-900">
                {totals.hasShippingSubtotal ? (
                  formatPrice(totals.shippingSubtotal!, currencyCode)
                ) : (
                  <span className="text-zinc-500 italic font-sans font-normal">
                    Calculated at checkout
                  </span>
                )}
              </span>
            </div>

            {totals.hasTaxTotal && (
              <div className="flex justify-between text-zinc-600">
                <span>VAT</span>
                <span className="font-mono text-zinc-900">
                  {formatPrice(totals.taxTotal!, currencyCode)}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-200 flex justify-between text-sm font-extrabold text-zinc-900">
              <span>Total</span>
              <span className="font-mono">
                {formatPrice(totals.total, currencyCode)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-zinc-900 text-white font-semibold text-sm hover:bg-black transition shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <p className="text-[11px] text-zinc-500 text-center">
            Standard Tunisia shipping & Cash on delivery applied at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
