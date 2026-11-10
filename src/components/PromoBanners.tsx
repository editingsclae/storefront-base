import React from "react";
import { Banner } from "@/logic";
import { BannerContent } from "@/components/BannerContent";
import { visiblePromoBanners } from "@/lib/declare-layout";

interface PromoBannersProps {
  banners: Banner[];
}

// The promo banners set by the merchant, side by side, never more than the places
// this page has (LAYOUT.promo_banners in src/lib/declare-layout.ts, the same number
// the portal is told). This design is made for 2. Nothing shows when the merchant
// has not added any.
export function PromoBanners({ banners: all }: PromoBannersProps) {
  const banners = visiblePromoBanners(all);
  if (banners.length === 0) return null;

  const pair = banners.length > 1;

  return (
    <section
      aria-label="Promotions"
      className={`grid gap-4 sm:gap-6 ${pair ? "md:grid-cols-2" : ""}`}
    >
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={`relative w-full overflow-hidden rounded-2xl bg-zinc-100 aspect-[16/9] sm:aspect-[8/3] ${
            pair ? "" : "lg:aspect-[16/5]"
          }`}
        >
          <BannerContent
            banner={banner}
            size="promo"
            sizes={pair ? "(max-width: 768px) 100vw, 600px" : "(max-width: 1280px) 100vw, 1216px"}
          />
        </div>
      ))}
    </section>
  );
}
