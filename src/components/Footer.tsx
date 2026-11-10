import React from "react";
import Link from "next/link";
import {
  FOOTER_NETWORK_NAMES,
  STORE_NAME,
  cleanCategoryHandle,
  getFooterSettings,
  type FooterNetwork,
} from "@/logic";

function SocialIcon({ network }: { network: FooterNetwork }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (network === "tiktok") {
    return (
      <svg {...common}>
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    );
  }
  if (network === "facebook") {
    return (
      <svg {...common}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const columnTitle = "text-sm font-semibold text-zinc-900";
const columnLink = "text-zinc-600 hover:text-zinc-900 transition";

export async function Footer() {
  const footer = await getFooterSettings();
  const name = footer.store_name || STORE_NAME;
  const description = footer.description || "Cash on delivery across Tunisia.";

  // Without a chosen category the Shop column still leads to the whole shop
  const shopLinks =
    footer.shop_categories.length > 0
      ? footer.shop_categories.map((category) => ({
          key: category.id,
          label: category.name,
          href: `/c/${encodeURIComponent(cleanCategoryHandle(category.handle))}`,
        }))
      : [{ key: "all", label: "All products", href: "/shop" }];

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="space-y-3 max-w-md text-center md:text-left">
            <p
              data-testid="footer-name"
              className="text-base font-semibold text-zinc-900 tracking-wider uppercase"
            >
              {name}
            </p>
            <p data-testid="footer-description" className="text-sm text-zinc-500">
              {description}
            </p>
            {footer.social_links.length > 0 && (
              <ul
                data-testid="footer-social"
                className="flex items-center justify-center md:justify-start gap-4 pt-1"
              >
                {footer.social_links.map((link) => (
                  <li key={link.network}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-network={link.network}
                      aria-label={FOOTER_NETWORK_NAMES[link.network]}
                      title={FOOTER_NETWORK_NAMES[link.network]}
                      className="text-zinc-600 hover:text-zinc-900 transition"
                    >
                      <SocialIcon network={link.network} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm text-center md:text-left sm:gap-16">
            <nav aria-label="Shop" data-testid="footer-shop" className="space-y-3">
              <p className={columnTitle}>Shop</p>
              <ul className="space-y-2">
                {shopLinks.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className={columnLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {footer.pages.length > 0 && (
              <nav aria-label="Support" data-testid="footer-support" className="space-y-3">
                <p className={columnTitle}>Support</p>
                <ul className="space-y-2">
                  {footer.pages.map((page) => (
                    <li key={page.slug}>
                      <Link href={`/pages/${page.slug}`} className={columnLink}>
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6 text-xs text-zinc-500 text-center md:text-left">
          &copy; {new Date().getFullYear()} {name}
        </div>
      </div>
    </footer>
  );
}
