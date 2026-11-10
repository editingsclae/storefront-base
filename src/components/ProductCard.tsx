"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/logic";
import { formatPrice, getCardState } from "@/logic";
import { useCart } from "@/context/CartContext";
import { Package, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const {
    singleVariant,
    canQuickAdd,
    price,
    range,
    hasRange,
    stockBadge,
    imageUrl,
    badge,
    subtitle,
  } = getCardState(product);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canQuickAdd || !singleVariant || isAdding) return;
    try {
      setIsAdding(true);
      await addToCart(singleVariant.id, 1);
    } catch (err) {
      console.error("Failed to quick add to cart:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group border border-zinc-200 rounded-lg overflow-hidden bg-white hover:border-zinc-300 hover:shadow-sm transition flex flex-col justify-between">
      <div>
        {/* Product Image Link */}
        <Link
          href={`/p/${product.handle}`}
          className="block relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center h-full">
              <Package size={36} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider font-medium">
                {product.title}
              </span>
            </div>
          )}

          {/* The merchant's badge: "New", "Bestseller", "Sale"... */}
          {badge && (
            <div className="absolute top-2 left-2">
              <span className="inline-block bg-zinc-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                {badge}
              </span>
            </div>
          )}

          {/* Stock Badge */}
          {stockBadge && (
            <div className="absolute top-2 right-2">
              {stockBadge.type === "out_of_stock" && (
                <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-rose-200">
                  {stockBadge.label}
                </span>
              )}
              {stockBadge.type === "low_stock" && (
                <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200">
                  {stockBadge.label}
                </span>
              )}
            </div>
          )}
        </Link>

        {/* Content Details */}
        <div className="p-4 space-y-2">
          {/* Title Link */}
          <Link
            href={`/p/${product.handle}`}
            className="block font-medium text-sm text-zinc-900 hover:text-black transition line-clamp-1"
          >
            {product.title}
          </Link>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-zinc-500 line-clamp-2">
              {subtitle}
            </p>
          )}

          {/* Price */}
          <div className="pt-1 text-sm font-semibold text-zinc-900">
            {hasRange && range ? (
              <>
                <span className="mr-1 text-xs font-medium text-zinc-500">From</span>
                {formatPrice(range.low, range.currency)}
              </>
            ) : price ? (
              formatPrice(price.calculated_amount, price.currency_code)
            ) : (
              <span className="text-zinc-400 text-xs">Price on request</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button Below (Non-nested) */}
      <div className="px-4 pb-4 pt-1 border-t border-zinc-100">
        {canQuickAdd ? (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isAdding}
            className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isAdding ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ShoppingBag size={13} />
            )}
            <span>Add to cart</span>
          </button>
        ) : (
          <Link
            href={`/p/${product.handle}`}
            className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 text-center"
          >
            <span>Choose options</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}
