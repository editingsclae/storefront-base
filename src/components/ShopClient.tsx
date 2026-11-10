"use client";

import React from "react";
import type { Product, MerchantCategory } from "@/logic";
import { cleanCategoryHandle, useShopFilters } from "@/logic";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import {
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  PackageX,
  Check,
} from "lucide-react";

interface ShopClientProps {
  products: Product[];
  categories: MerchantCategory[];
  fixedCategory?: MerchantCategory;
}

export function ShopClient({
  products,
  categories,
  fixedCategory,
}: ShopClientProps) {
  const {
    isMobileFiltersOpen,
    setIsMobileFiltersOpen,
    resultsRef,
    searchInput,
    setSearchInput,
    minInput,
    setMinInput,
    maxInput,
    setMaxInput,
    catalogMinPrice,
    catalogMaxPrice,
    categoryCounts,
    visibleCategories,
    catalogOptions,
    activeSort,
    activeInStock,
    activeCategoryHandles,
    activeOptionFilters,
    sortedProducts,
    pageProducts,
    totalPages,
    currentPage,
    firstShown,
    lastShown,
    activeChips,
    hasActiveFilters,
    handleToggleCategory,
    handleToggleOptionValue,
    handleClearAllFilters,
    handlePageChange,
    updateParams,
  } = useShopFilters(products, { categories, fixedCategory });

  // Filter Sidebar / Sheet Content
  const renderFilterControls = (isMobileSheet = false) => (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-7 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
          />
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                updateParams({ q: null });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Categories (hidden on fixedCategory) */}
      {!fixedCategory && visibleCategories.length > 0 && (
        <div className="border-t border-zinc-200 pt-5">
          <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
            Categories
          </label>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {visibleCategories.map((cat) => {
              const clean = cleanCategoryHandle(cat.handle).toLowerCase();
              const isChecked = activeCategoryHandles.includes(clean);
              const count = categoryCounts.get(clean) || 0;
              return (
                <label
                  key={cat.id}
                  className="flex items-center justify-between text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCategory(cat.handle)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="border-t border-zinc-200 pt-5">
        <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
          Price Range
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              step="any"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder={`${catalogMinPrice}`}
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              aria-label="Minimum price"
            />
          </div>
          <span className="text-zinc-400 text-xs">-</span>
          <div className="flex-1">
            <input
              type="number"
              min="0"
              step="any"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder={`${catalogMaxPrice}`}
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      {/* In Stock Only */}
      <div className="border-t border-zinc-200 pt-5">
        <label className="flex items-center justify-between text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer select-none">
          <span className="font-semibold uppercase tracking-wider text-zinc-900">
            In stock only
          </span>
          <input
            type="checkbox"
            checked={activeInStock}
            onChange={(e) =>
              updateParams({ stock: e.target.checked ? "1" : null })
            }
            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-4 w-4 cursor-pointer"
          />
        </label>
      </div>

      {/* Dynamic Product Options */}
      {catalogOptions.map((opt) => {
        const activeVals = activeOptionFilters.get(opt.title) || [];
        return (
          <div key={opt.title} className="border-t border-zinc-200 pt-5">
            <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2.5">
              {opt.title}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {opt.values.map((val) => {
                const isChecked = activeVals.includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        handleToggleOptionValue(opt.title, opt.paramName, val)
                      }
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{val}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Clear All inside mobile sheet */}
      {isMobileSheet && hasActiveFilters && (
        <div className="border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
          >
            <RotateCcw size={13} />
            <span>Clear all filters</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mobile Top Bar: Filters Trigger + Sort */}
      <div className="lg:hidden flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeChips.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
              {activeChips.length}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <label htmlFor="mobile-sort" className="text-xs text-zinc-500">
            Sort:
          </label>
          <select
            id="mobile-sort"
            value={activeSort}
            onChange={(e) =>
              updateParams({
                sort: e.target.value === "newest" ? null : e.target.value,
              })
            }
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-xl border border-zinc-200 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <span className="text-sm font-bold text-zinc-900">Filters</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition"
              >
                <RotateCcw size={12} />
                <span>Clear all</span>
              </button>
            )}
          </div>
          {renderFilterControls(false)}
        </aside>

        {/* Main Products Grid Area */}
        <div ref={resultsRef} className="lg:col-span-3 space-y-4 scroll-mt-28">
          {/* Desktop Top Header Bar: Counts, Chips, Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-600">
                {totalPages > 1
                  ? `${firstShown}\u2013${lastShown} of ${sortedProducts.length} products`
                  : `${sortedProducts.length} ${
                      sortedProducts.length === 1 ? "product" : "products"
                    }`}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="hidden sm:inline-flex text-xs text-zinc-500 hover:text-zinc-900 items-center gap-1 transition"
                >
                  <RotateCcw size={12} />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <label htmlFor="desktop-sort" className="text-xs text-zinc-500">
                Sort:
              </label>
              <select
                id="desktop-sort"
                value={activeSort}
                onChange={(e) =>
                  updateParams({
                    sort: e.target.value === "newest" ? null : e.target.value,
                  })
                }
                className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {activeChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="text-zinc-400 hover:text-zinc-700 transition"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Empty State */}
          {sortedProducts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-zinc-200 rounded-xl space-y-3 bg-zinc-50/50">
              <PackageX size={44} className="mx-auto text-zinc-400" />
              <h3 className="text-base font-semibold text-zinc-900">
                No products found
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No items match your active filters. Try loosening your criteria or search term.
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition"
                  >
                    <RotateCcw size={13} />
                    <span>Clear filters</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Product Grid */}
          {sortedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet Filters Modal */}
      {isMobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter products"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
              <span className="text-sm font-bold text-zinc-900">Filters</span>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md transition"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Filter Controls */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {renderFilterControls(true)}
            </div>

            {/* Bottom Apply Action Button */}
            <div className="p-4 border-t border-zinc-200 bg-white">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Check size={14} />
                <span>Apply ({sortedProducts.length} results)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
