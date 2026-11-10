"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MerchantCategory, STORE_NAME } from "@/logic";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";

// How many categories sit in the top bar. The rest are only in the
// "All Categories" dropdown, which lists every category.
const TOP_BAR_CATEGORIES = 5;

interface HeaderProps {
  categories: MerchantCategory[];
}

export function Header({ categories }: HeaderProps) {
  const { itemCount, openCart } = useCart();
  const { customer } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isCartOrCheckout = pathname === "/cart" || pathname === "/checkout";
  const topCategories = categories.slice(0, TOP_BAR_CATEGORIES);

  // Close the categories dropdown on an outside click or Esc. Choosing a link
  // closes it through the link's own onClick.
  useEffect(() => {
    if (!categoriesOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoriesOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoriesOpen]);

  const navLinkClass = (active: boolean) =>
    `text-sm whitespace-nowrap transition hover:text-black ${
      active ? "font-semibold text-zinc-900" : "font-medium text-zinc-600"
    }`;

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = desktopSearch.trim();
    if (query) {
      router.push(`/shop?q=${encodeURIComponent(query)}`);
      setDesktopSearch("");
    } else {
      router.push("/shop");
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = mobileSearch.trim();
    setMobileMenuOpen(false);
    if (query) {
      router.push(`/shop?q=${encodeURIComponent(query)}`);
      setMobileSearch("");
    } else {
      router.push("/shop");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: store name, search, account and cart */}
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Left: Mobile Menu Toggle & Store Name */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href="/"
              className="font-bold tracking-widest text-lg sm:text-xl uppercase text-zinc-900 hover:opacity-80 transition"
            >
              {STORE_NAME}
            </Link>
          </div>

          {/* Center: Desktop Search Bar */}
          <form
            onSubmit={handleDesktopSearch}
            role="search"
            className="hidden md:flex flex-1 max-w-2xl mx-auto items-stretch"
          >
            <input
              type="text"
              value={desktopSearch}
              onChange={(e) => setDesktopSearch(e.target.value)}
              placeholder="Search for products..."
              aria-label="Search products"
              className="w-full min-w-0 text-sm bg-zinc-50 border border-zinc-200 border-r-0 rounded-l-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition"
            />
            <button
              type="submit"
              aria-label="Search"
              className="px-4 bg-zinc-900 hover:bg-black text-white rounded-r-lg transition flex items-center justify-center"
            >
              <Search size={16} />
            </button>
          </form>

          {/* Right: Customer & Cart Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/account"
              className="flex items-center gap-2 p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition text-sm"
              title={customer ? `Logged in as ${customer.email}` : "Sign In"}
            >
              <User size={19} />
              <span className="hidden sm:inline font-medium">
                {customer ? customer.first_name || "Account" : "Sign In"}
              </span>
            </Link>

            {isCartOrCheckout ? (
              <Link
                href="/cart"
                id="header-cart-button"
                className="relative flex items-center gap-2 p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition text-sm"
                title="View Cart"
              >
                <ShoppingBag size={19} />
                <span className="hidden sm:inline font-medium">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                id="header-cart-button"
                onClick={openCart}
                className="relative flex items-center gap-2 p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition text-sm cursor-pointer"
                title="Open Cart"
                aria-label={`Open Cart with ${itemCount} items`}
              >
                <ShoppingBag size={19} />
                <span className="hidden sm:inline font-medium">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Row 2 (desktop): All Categories dropdown, Home, Shop and the first categories */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-5 h-11 border-t border-zinc-100"
        >
          {categories.length > 0 && (
            <div ref={dropdownRef} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-sm font-semibold rounded-md transition cursor-pointer"
              >
                <Menu size={16} />
                <span>All Categories</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 max-h-[70vh] overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-lg p-2 z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/c/${cat.handle}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition"
                    >
                      <span className="truncate">{cat.name}</span>
                      <ChevronRight size={15} className="text-zinc-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link href="/" className={navLinkClass(pathname === "/")}>
            Home
          </Link>
          <Link href="/shop" className={navLinkClass(pathname === "/shop")}>
            Shop
          </Link>

          {/* Category links need room: the first 3 show from the lg breakpoint,
              all 5 from xl. Every category is also in the dropdown. */}
          {topCategories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/c/${cat.handle}`}
              title={cat.name}
              className={`${index < 3 ? "hidden lg:block" : "hidden xl:block"} max-w-[14rem] truncate ${navLinkClass(
                pathname === `/c/${cat.handle}`
              )}`}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {/* Mobile Search Box at top of menu */}
          <form onSubmit={handleMobileSearch} className="relative mb-3">
            <input
              type="text"
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
          </form>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between py-2 text-sm font-semibold text-zinc-900 hover:text-black border-b border-zinc-100"
          >
            <span>Home</span>
            <ChevronRight size={16} className="text-zinc-400" />
          </Link>

          {/* Shop Link */}
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between py-2 text-sm font-semibold text-zinc-900 hover:text-black border-b border-zinc-100"
          >
            <span>Shop</span>
            <ChevronRight size={16} className="text-zinc-400" />
          </Link>

          {categories.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider my-2">
                Categories
              </div>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/c/${cat.handle}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm font-medium text-zinc-800 hover:text-black border-b border-zinc-100"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {cat.product_count}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="pt-3">
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-zinc-800"
            >
              <User size={16} />
              <span>
                {customer
                  ? `My Account (${customer.email})`
                  : "Customer Sign In / Register"}
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
