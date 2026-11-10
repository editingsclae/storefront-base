import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Banner, bannerHref } from "@/logic";

interface BannerContentProps {
  banner: Banner;
  size: "hero" | "promo";
  priority?: boolean;
  sizes: string;
}

// The inside of a banner: the image, the text over it and the link. The parent
// has to be `relative` and sets the shape. With no text the image stands alone.
export function BannerContent({ banner, size, priority, sizes }: BannerContentProps) {
  const href = bannerHref(banner.link);
  const hasText = Boolean(
    banner.label || banner.title || banner.text || banner.button_label
  );
  const hasButton = Boolean(banner.button_label && href);
  const isHero = size === "hero";

  return (
    <>
      <Image
        src={banner.image_url}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />

      {/* Without a button the whole banner is the link */}
      {href && !hasButton && (
        <Link
          href={href}
          aria-label={banner.title || banner.label || "View"}
          className="absolute inset-0 z-10"
        />
      )}

      {hasText && (
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/65 via-black/35 to-transparent pointer-events-none">
          <div
            className={`w-full max-w-xl space-y-2 sm:space-y-3 text-white ${
              isHero ? "px-6 sm:px-12" : "px-5 sm:px-8"
            }`}
          >
            {banner.label && (
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-white/90 text-zinc-900">
                {banner.label}
              </span>
            )}
            {banner.title && (
              <h2
                className={`font-extrabold tracking-tight leading-tight ${
                  isHero ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"
                }`}
              >
                {banner.title}
              </h2>
            )}
            {banner.text && (
              <p
                className={`text-white/90 ${
                  isHero ? "text-sm sm:text-base" : "text-xs sm:text-sm"
                }`}
              >
                {banner.text}
              </p>
            )}
            {hasButton && href && (
              <div className="pt-1">
                <Link
                  href={href}
                  className="pointer-events-auto relative z-20 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-100 transition shadow-sm"
                >
                  <span>{banner.button_label}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
