// Tells the backend how many promo banners this storefront has room for, so the
// merchant's portal shows exactly that many places. Runs when the server starts
// (see src/instrumentation.ts). Saying the same thing again changes nothing.

// The number of promo banner places on this storefront's home page.
// This is the one number for both things: it is what the portal is told, and it
// is the most banners the page draws (see PromoBanners). Only change it together
// with the page: add or remove the places in PromoBanners first, then change the
// number. Changing the number alone must never add a place to the page.
export type SectionKey = "new_arrivals" | "best_sellers" | "trending" | "featured";
export type SectionPlace = { key: SectionKey; count: number };

// The product sections of the home page, in the order the page draws them, with
// the most products each one shows. Same rule as the promo banners: this list is
// what the portal is told AND what the page draws (see HomePage and
// visibleSections). To add or remove a section, change the page and this list together.
export const SECTIONS: SectionPlace[] = [
  { key: "new_arrivals", count: 8 },
  { key: "best_sellers", count: 4 },
  { key: "trending", count: 4 },
  { key: "featured", count: 4 },
];

export const LAYOUT = { promo_banners: 2, sections: SECTIONS };

// The maximum number of category tiles this storefront's home page draws.
// This number must match what the page draws (see CategoryTiles).
export const CATEGORY_TILE_PLACES = 8;

// The sections the backend sent, cut to what this page has: only the sections it
// declared, in its own order, each with at most its declared number of products.
export function visibleSections<T extends { key: string; product_ids: string[] }>(
  sections: T[],
  places: SectionPlace[] = SECTIONS
): T[] {
  const result: T[] = [];
  for (const place of places) {
    const found = sections.find((s) => s.key === place.key);
    if (!found) continue;
    const product_ids = found.product_ids.slice(0, Math.max(0, place.count));
    if (product_ids.length > 0) result.push({ ...found, product_ids });
  }
  return result;
}

// The banners the page has room for: never more than the places it declared
export function visiblePromoBanners<T>(banners: T[], places: number = LAYOUT.promo_banners): T[] {
  return banners.slice(0, Math.max(0, places));
}

type Env = Record<string, string | undefined>;

export type DeclareResult = "skipped" | "declared" | "failed";

export async function declareLayout(
  env: Env = process.env,
  fetchFn: typeof fetch = fetch
): Promise<DeclareResult> {
  const layoutKey = env.STOREFRONT_LAYOUT_KEY;
  const publishableKey = env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const backend = env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.getcardy.shop";

  // Without a layout key nothing is sent and the merchant keeps the default
  // number of places. The key is created in the portal (Appearance, Promo banners).
  if (!layoutKey || !publishableKey) {
    console.info("[layout] STOREFRONT_LAYOUT_KEY is not set: the number of promo banners is not declared.");
    return "skipped";
  }

  try {
    const response = await fetchFn(`${backend.replace(/\/+$/, "")}/store/merchant/storefront/layout`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
        "x-layout-key": layoutKey,
      },
      body: JSON.stringify(LAYOUT),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`[layout] The backend refused the layout (${response.status}). Check STOREFRONT_LAYOUT_KEY.`);
      return "failed";
    }
    console.info(
      `[layout] Declared ${LAYOUT.promo_banners} promo banner places and ${LAYOUT.sections.length} product sections.`
    );
    return "declared";
  } catch (error) {
    // Never stop the storefront from starting because of this
    console.error("[layout] Could not declare the layout:", error);
    return "failed";
  }
}
