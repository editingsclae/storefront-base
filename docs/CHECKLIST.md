# Storefront Live Verification Checklist

Derived from Section C of NOVA checklist for verifying storefront functionality on localhost before deploying.

## Catalogue
- [ ] Home, Shop and each category show only this merchant's products and categories
- [ ] Header menu and footer Shop column show the merchant's categories, not hardcoded categories or another merchant's
- [ ] Search finds a product by name; price filter range matches the real prices; "in stock only" hides sold-out products
- [ ] More than 9 products: pagination shows, `?page=2` survives a refresh, Back from a product returns to the same page
- [ ] Prices show in TND from the region (change nothing in code, price edit in the portal shows after a refresh)

## Product page
- [ ] Gallery shows the product's own images, thumbnails and lightbox work
- [ ] Size/option buttons are the product's options; an option value at stock 0 is greyed out; a fully sold-out product shows Sold out
- [ ] Switching options changes price and stock text; a product with one variant shows no picker
- [ ] Badge pill shows exactly the portal text; no badge when None
- [ ] Add to cart and Buy it now both work with the chosen variant

## Home page
- [ ] Hero slides, tiles and promo banners match the portal; edit one in the portal and see it after one refresh
- [ ] Server log on start: `[layout] Declared N promo banner places and M product sections.` (after the layout key is set)
- [ ] Portal Appearance shows declared promo places and product sections
- [ ] Promo banners and product sections reflect declared constants in `declare-layout.ts`
- [ ] Section ordering and product limits match declared constants
- [ ] Turn a section off or rename it in the portal: the row disappears or the heading changes
- [ ] Category tiles capped to `CATEGORY_TILE_PLACES`

## Cart and checkout
- [ ] Cart shows variant (e.g. "EU 42"), quantity stepper, remove, correct totals; refresh keeps the cart
- [ ] Checkout needs email, phone and city; delivery options come from the portal (rename one or set it to 0 and see "Free")
- [ ] Cash on delivery only, no card wording
- [ ] Order completes; cart is cleared on confirmation page; confirmation shows `Order #<number>`; order is in the merchant portal
- [ ] Order confirmation email arrives at the checkout email

## Accounts
- [ ] Register works, then confirm the email with the 6 digit code; "Email confirmed" badge shows
- [ ] Register again with the same email: "You already have an account with this email. Log in instead."
- [ ] Log in, refresh: still logged in; My orders shows only this store's orders
- [ ] Guest order placed before registering shows in My orders after confirming the email
- [ ] Forgot password: code email arrives, reset works, auto-login
- [ ] Log out clears the cart and resets token

## Pages and footer
- [ ] Footer name, description, social links and support links match the portal; a page without text is not listed
- [ ] `/pages/<slug>` shows the merchant's formatted rich blocks; an unwritten page is a 404

## Security & Cleanliness
- [ ] No seeded orders or cart items appear for a new visitor
- [ ] Browser devtools: no request goes to `/admin/*`; no secret in the page source
- [ ] Components and client pages never import from `@/lib/medusa` directly

