"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Banner } from "@/logic";
import { BannerContent } from "@/components/BannerContent";

const AUTOPLAY_MS = 6000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

interface HeroSliderProps {
  slides: Banner[];
}

// Up to 3 slides set by the merchant. It moves by itself unless the shopper
// prefers reduced motion, and stops while the mouse or the keyboard is on it.
export function HeroSlider({ slides }: HeroSliderProps) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

  const current = count > 0 ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [count, paused, reducedMotion, current]);

  if (count === 0) return null;

  const go = (next: number) => setIndex((next + count) % count);

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative w-full overflow-hidden rounded-2xl bg-zinc-100 aspect-[4/3] sm:aspect-[16/7] lg:aspect-[16/5]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
          aria-hidden={i !== current}
          inert={i !== current}
          className={`absolute inset-0 transition-opacity duration-500 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <BannerContent
            banner={slide}
            size="hero"
            priority={i === 0}
            sizes="(max-width: 1280px) 100vw, 1216px"
          />
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-zinc-900 flex items-center justify-center shadow transition cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-zinc-900 flex items-center justify-center shadow transition cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === current ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
