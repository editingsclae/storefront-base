"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import type { Product, MerchantCategory } from "@/lib/medusa";
import { cleanCategoryHandle, formatPrice } from "@/lib/medusa";
import {
  PRODUCTS_PER_PAGE,
  pageCount,
  pageSlice,
  parsePage,
} from "@/lib/pagination";
import {
  getCatalogPriceBounds,
  getCategoryCounts,
  getVisibleCategories,
  getCatalogOptions,
  filterProducts,
  sortProducts,
  formatResultRange,
  type CatalogOption,
} from "./shop-filters";

export interface UseShopFiltersOptions {
  categories?: MerchantCategory[];
  fixedCategory?: MerchantCategory;
}

export interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

export function useShopFilters(
  products: Product[],
  options: UseShopFiltersOptions = {}
) {
  const { categories = [], fixedCategory } = options;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mobile sheet open state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Top of the results: where the page scrolls to when the page changes
  const resultsRef = useRef<HTMLDivElement>(null);

  // Local state for debounced inputs
  const urlQ = searchParams.get("q") || "";
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [searchInput, setSearchInput] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setSearchInput(urlQ);
  }

  const urlMin = searchParams.get("min") || "";
  const [prevUrlMin, setPrevUrlMin] = useState(urlMin);
  const [minInput, setMinInput] = useState(urlMin);
  if (urlMin !== prevUrlMin) {
    setPrevUrlMin(urlMin);
    setMinInput(urlMin);
  }

  const urlMax = searchParams.get("max") || "";
  const [prevUrlMax, setPrevUrlMax] = useState(urlMax);
  const [maxInput, setMaxInput] = useState(urlMax);
  if (urlMax !== prevUrlMax) {
    setPrevUrlMax(urlMax);
    setMaxInput(urlMax);
  }

  // URL state update helper
  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      // Any filter, search or sort change starts again from page 1. Only a
      // call that sets the page itself keeps it.
      if (!("page" in newParams)) {
        current.delete("page");
      }
      for (const [key, val] of Object.entries(newParams)) {
        if (val === null || val === undefined || val === "") {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      }
      const qs = current.toString();
      // history.replaceState keeps useSearchParams in sync (Next.js 14.1+) but
      // does not re-render the server page. router.replace would refetch the
      // whole catalog from the backend on every keystroke or click.
      window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);
    },
    [searchParams, pathname]
  );

  // Debounced search input handler (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      const trimmed = searchInput.trim();
      if (trimmed !== currentQ) {
        updateParams({ q: trimmed || null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, updateParams]);

  // Debounced price min/max handler (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentMin = searchParams.get("min") || "";
      const trimmedMin = minInput.trim();
      if (trimmedMin !== currentMin) {
        updateParams({ min: trimmedMin || null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [minInput, searchParams, updateParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentMax = searchParams.get("max") || "";
      const trimmedMax = maxInput.trim();
      if (trimmedMax !== currentMax) {
        updateParams({ max: trimmedMax || null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [maxInput, searchParams, updateParams]);

  // Catalog min & max price
  const { catalogMinPrice, catalogMaxPrice } = useMemo(
    () => getCatalogPriceBounds(products),
    [products]
  );

  // Category product counts from loaded products
  const categoryCounts = useMemo(
    () => getCategoryCounts(products),
    [products]
  );

  // Visible categories (product_count > 0)
  const visibleCategories = useMemo(
    () => getVisibleCategories(categories, categoryCounts),
    [categories, categoryCounts]
  );

  // Build catalog options with >= 2 distinct values across catalog
  const catalogOptions = useMemo<CatalogOption[]>(
    () => getCatalogOptions(products),
    [products]
  );

  // Parse active filters from URL
  const activeQ = searchParams.get("q") || "";

  const activeCategoryHandles = useMemo(() => {
    const raw = searchParams.get("category");
    if (!raw) return [];
    return raw
      .split(",")
      .map((h) => cleanCategoryHandle(h.trim()).toLowerCase())
      .filter(Boolean);
  }, [searchParams]);

  const activeMinPrice = useMemo(() => {
    const raw = searchParams.get("min");
    if (!raw) return null;
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  }, [searchParams]);

  const activeMaxPrice = useMemo(() => {
    const raw = searchParams.get("max");
    if (!raw) return null;
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  }, [searchParams]);

  const activeInStock = searchParams.get("stock") === "1";
  const activeSort = searchParams.get("sort") || "newest";

  // Parse option filters from URL
  const activeOptionFilters = useMemo(() => {
    const filters = new Map<string, string[]>(); // canonicalTitle -> values[]
    for (const opt of catalogOptions) {
      const raw = searchParams.get(opt.paramName);
      if (raw) {
        const vals = raw
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        if (vals.length > 0) {
          filters.set(opt.title, vals);
        }
      }
    }
    return filters;
  }, [searchParams, catalogOptions]);

  // Filtering + Sorting in browser
  const filteredProducts = useMemo(() => {
    return filterProducts(products, {
      q: activeQ,
      categoryHandles: activeCategoryHandles,
      fixedCategory,
      minPrice: activeMinPrice,
      maxPrice: activeMaxPrice,
      inStock: activeInStock,
      optionFilters: activeOptionFilters,
    });
  }, [
    products,
    activeQ,
    fixedCategory,
    activeCategoryHandles,
    activeMinPrice,
    activeMaxPrice,
    activeInStock,
    activeOptionFilters,
  ]);

  // Sorted products
  const sortedProducts = useMemo(() => {
    return sortProducts(filteredProducts, activeSort);
  }, [filteredProducts, activeSort]);

  // Pagination
  const totalPages = pageCount(sortedProducts.length);
  const currentPage = parsePage(searchParams.get("page"), totalPages);
  const pageProducts = useMemo(
    () => pageSlice(sortedProducts, currentPage),
    [sortedProducts, currentPage]
  );
  const firstShown = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const lastShown = firstShown + pageProducts.length - 1;

  const handlePageChange = useCallback(
    (page: number) => {
      const next = Math.min(Math.max(1, page), totalPages);
      updateParams({ page: next === 1 ? null : String(next) });
      // Show the top of the new page's products, not the bottom of the old page
      requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        resultsRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    },
    [totalPages, updateParams]
  );

  // Handlers for toggles
  const handleToggleCategory = useCallback(
    (handle: string) => {
      const clean = cleanCategoryHandle(handle).toLowerCase();
      let next: string[];
      if (activeCategoryHandles.includes(clean)) {
        next = activeCategoryHandles.filter((h) => h !== clean);
      } else {
        next = [...activeCategoryHandles, clean];
      }
      updateParams({ category: next.length > 0 ? next.join(",") : null });
    },
    [activeCategoryHandles, updateParams]
  );

  const handleToggleOptionValue = useCallback(
    (optTitle: string, paramName: string, val: string) => {
      const currentVals = activeOptionFilters.get(optTitle) || [];
      let next: string[];
      if (currentVals.includes(val)) {
        next = currentVals.filter((v) => v !== val);
      } else {
        next = [...currentVals, val];
      }
      updateParams({ [paramName]: next.length > 0 ? next.join(",") : null });
    },
    [activeOptionFilters, updateParams]
  );

  const handleClearAllFilters = useCallback(() => {
    window.history.replaceState(null, "", pathname);
  }, [pathname]);

  // Lock scroll on mobile bottom sheet open & escape key
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsMobileFiltersOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isMobileFiltersOpen]);

  // Build active filter chips
  const activeChips = useMemo(() => {
    const chips: FilterChip[] = [];

    if (activeQ) {
      chips.push({
        id: "q",
        label: `"${activeQ}"`,
        onRemove: () => updateParams({ q: null }),
      });
    }

    if (!fixedCategory) {
      for (const h of activeCategoryHandles) {
        const cat = categories.find(
          (c) => cleanCategoryHandle(c.handle).toLowerCase() === h
        );
        chips.push({
          id: `cat_${h}`,
          label: cat ? cat.name : h,
          onRemove: () => handleToggleCategory(h),
        });
      }
    }

    if (activeMinPrice !== null) {
      chips.push({
        id: "min",
        label: `Min: ${formatPrice(activeMinPrice)}`,
        onRemove: () => updateParams({ min: null }),
      });
    }

    if (activeMaxPrice !== null) {
      chips.push({
        id: "max",
        label: `Max: ${formatPrice(activeMaxPrice)}`,
        onRemove: () => updateParams({ max: null }),
      });
    }

    if (activeInStock) {
      chips.push({
        id: "stock",
        label: "In stock only",
        onRemove: () => updateParams({ stock: null }),
      });
    }

    for (const [title, vals] of activeOptionFilters.entries()) {
      const opt = catalogOptions.find((o) => o.title === title);
      const paramName = opt ? opt.paramName : `opt_${title}`;
      for (const val of vals) {
        chips.push({
          id: `opt_${title}_${val}`,
          label: `${title}: ${val}`,
          onRemove: () => handleToggleOptionValue(title, paramName, val),
        });
      }
    }

    return chips;
  }, [
    activeQ,
    fixedCategory,
    activeCategoryHandles,
    categories,
    activeMinPrice,
    activeMaxPrice,
    activeInStock,
    activeOptionFilters,
    catalogOptions,
    updateParams,
    handleToggleCategory,
    handleToggleOptionValue,
  ]);

  const hasActiveFilters = activeChips.length > 0;

  const rangeText = useMemo(
    () =>
      formatResultRange(
        currentPage,
        PRODUCTS_PER_PAGE,
        pageProducts.length,
        sortedProducts.length,
        totalPages
      ),
    [currentPage, pageProducts.length, sortedProducts.length, totalPages]
  );

  return {
    state: {
      q: activeQ,
      searchInput,
      minPrice: minInput,
      maxPrice: maxInput,
      sort: activeSort,
      inStock: activeInStock,
      categoryHandles: activeCategoryHandles,
      optionFilters: activeOptionFilters,
      page: currentPage,
      isMobileFiltersOpen,
    },
    visibleProducts: pageProducts,
    total: sortedProducts.length,
    range: {
      firstShown,
      lastShown,
      total: sortedProducts.length,
      text: rangeText,
    },
    pages: totalPages,
    currentPage,
    categoryCounts,
    visibleCategories,
    priceBounds: {
      min: catalogMinPrice,
      max: catalogMaxPrice,
    },
    catalogMinPrice,
    catalogMaxPrice,
    optionGroups: catalogOptions,
    catalogOptions,

    // Handlers
    setSearch: setSearchInput,
    setMinPrice: setMinInput,
    setMaxPrice: setMaxInput,
    setPrice: (min: string | null, max: string | null) => {
      if (min !== null) setMinInput(min);
      if (max !== null) setMaxInput(max);
      updateParams({
        min: min?.trim() || null,
        max: max?.trim() || null,
      });
    },
    toggleCategory: handleToggleCategory,
    toggleInStock: (stock?: boolean) => {
      const next = stock !== undefined ? stock : !activeInStock;
      updateParams({ stock: next ? "1" : null });
    },
    toggleOption: handleToggleOptionValue,
    setSort: (sort: string) => {
      updateParams({ sort: sort === "newest" ? null : sort });
    },
    clearAll: handleClearAllFilters,
    goToPage: handlePageChange,

    // Presentation helpers
    activeChips,
    hasActiveFilters,
    resultsRef,
    isMobileFiltersOpen,
    setIsMobileFiltersOpen,

    // Preserved names for direct drop-in to ShopClient JSX
    searchInput,
    setSearchInput,
    minInput,
    setMinInput,
    maxInput,
    setMaxInput,
    activeSort,
    activeInStock,
    activeCategoryHandles,
    activeOptionFilters,
    sortedProducts,
    pageProducts,
    totalPages,
    firstShown,
    lastShown,
    rangeText,
    handleToggleCategory,
    handleToggleOptionValue,
    handlePageChange,
    handleClearAllFilters,
    updateParams,
  };
}
