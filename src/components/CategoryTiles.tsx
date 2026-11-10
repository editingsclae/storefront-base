import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { CategoryTile, cleanCategoryHandle } from "@/logic";

interface CategoryTilesProps {
  tiles: CategoryTile[];
}

// Up to 8 categories with a round picture, chosen by the merchant in the
// portal. Nothing shows when there are none: the home page then falls back to
// its simple list of categories.
export function CategoryTiles({ tiles }: CategoryTilesProps) {
  if (tiles.length === 0) return null;

  return (
    <section aria-labelledby="shop-by-category" className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-zinc-700" />
          <h2
            id="shop-by-category"
            className="text-xl font-bold tracking-tight text-zinc-900"
          >
            Shop by Category
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs font-medium text-zinc-600 hover:text-black transition"
        >
          View all &rarr;
        </Link>
      </div>

      {/* 4 per row on phones and tablets, one row from large screens */}
      <ul
        style={{ "--tile-count": tiles.length } as React.CSSProperties}
        className="grid grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-5 lg:[grid-template-columns:repeat(var(--tile-count),minmax(0,1fr))]"
      >
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link
              href={`/c/${cleanCategoryHandle(tile.handle)}`}
              className="group flex flex-col items-center gap-2.5 text-center"
            >
              <span className="relative block aspect-square w-full max-w-[120px] overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 transition group-hover:ring-2 group-hover:ring-zinc-900 group-focus-visible:ring-2 group-focus-visible:ring-zinc-900">
                <Image
                  src={tile.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 25vw, 120px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </span>
              <span className="text-xs sm:text-sm font-medium text-zinc-800 group-hover:text-black leading-snug">
                {tile.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
