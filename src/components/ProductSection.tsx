import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/logic";
import { ProductCard } from "@/components/ProductCard";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
}

// One row of products on the home page: New Arrivals, Best Sellers, Trending Now
// or Featured Products. The backend chooses the products; the title is the merchant's.
export function ProductSection({ title, subtitle, products }: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-6" aria-label={title}>
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        <Link
          href="/shop"
          className="text-xs font-semibold text-zinc-700 hover:text-black transition flex items-center gap-1"
        >
          <span>See all products</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
}
