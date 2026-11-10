# Merchant Storefront Backend Architecture


## Overview

One Medusa v2 backend serves every merchant: each merchant is one sales channel, and a custom storefront sees only that channel through its own publishable API key.

- **Tenant = sales channel.** Products, stock, carts and orders are tied to the merchant's sales channel. A storefront never needs to know about other merchants.
- **One key per storefront.** Creating a merchant also creates a publishable API key linked to its sales channel. The storefront sends that key on every Store API call.
- **Orders land in the merchant portal.** A cart created with the merchant's key becomes an order in that channel, and the merchant fulfils it from the portal.
- **Two things are shared across all merchants and need care:** product categories and customer accounts. Section 5 gives the rules.
- **A storefront only talks to the Store API.** It never calls `/admin/*`, never holds an admin token and never ships a secret to the browser.

## 2. Architecture at a glance

Every merchant is one **sales channel**. Everything a storefront shows or sells hangs off that channel; a few things are shared by all merchants.

&#91;embedded content: architecture · one merchant = one sales channel\]

Merchant-owned data is reached through the publishable key; customers, regions and payment providers are shared across every merchant.

| Resource | Per merchant or shared | How it is tied to the merchant | How a storefront reaches it |
| --- | --- | --- | --- |
| Sales channel | One per merchant | It is the merchant (the tenant id, `sc_...`) | Implied by the publishable key |
| Publishable API key | One per storefront | Linked to the channel | `x-publishable-api-key` header |
| Stock location | One per merchant | Linked to the channel | Inventory and shipping lookups |
| Products and variants | Per merchant | Linked to the channel | `/store/products` |
| Categories | Per merchant | Ownership link between channel and category; handle prefixed with the channel id | Through products (section 5) |
| Carts and orders | Per merchant | `sales_channel_id` copied from the key | `/store/carts`, order completion |
| Merchant user | One per merchant | Metadata holds `sales_channel_id` and `stock_location_id` | Portal only, never a storefront |
| Customers | **Shared by all merchants** | No channel link | `/auth/customer`, `/store/customers/me` |
| Regions, currencies, payment providers | **Shared by all merchants** | No channel link | `/store/regions` |

## 3. Connecting a storefront

A storefront needs exactly two values from the platform: the backend URL and that merchant's publishable key. The key is what ties every request to the merchant's sales channel.

| Value | Where it comes from | Storefront env var |
| --- | --- | --- |
| Backend URL | `https://api.getcardy.shop` | `MEDUSA_BACKEND_URL` |
| Publishable key (`pk_...`) | Returned once as `publishable_key` when the merchant is provisioned (`POST /admin/merchants`); also visible in Admin → Settings → Publishable API Keys | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |
| Storefront public URL | The merchant's own domain | `NEXT_PUBLIC_BASE_URL` |
| Default country | Any country code in the merchant's region | `NEXT_PUBLIC_DEFAULT_REGION` |

The DTC starter in `apps/storefront` already reads all four, so modifying it needs no code change for the connection itself.

### SDK setup (Next.js)

```ts
import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL!,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
```

Without the SDK, send the header `x-publishable-api-key: <pk_...>` on every `/store/*` request. A request without it is rejected.

### Backend settings that must be changed per storefront

- **`STORE_CORS`**: add the storefront's origin (for example `https://shop.example.com`). Browser calls from an unlisted origin fail.
- **`AUTH_CORS`**: add the same origin so customer login and registration work from the browser.
- Both are environment variables in Dokploy and need a backend redeploy.

### Customer login

Use the SDK's customer auth: `sdk.auth.register("customer", "emailpass", {...})`, then `sdk.store.customer.create(...)`; later `sdk.auth.login("customer", "emailpass", {...})`. The starter's `src/lib/data/customer.ts` already does this.

### Images

Product images are served from the file storage host (R2 or `*.getcardy.shop`). The storefront's `next.config.js` must list that host under `images.remotePatterns`; the starter already includes `*.getcardy.shop` and `*.r2.dev`.

## 4. Store API map

A storefront uses only `/store/*`. Never call `/admin/*` from a storefront: merchants are blocked from core admin routes, and the portal API (`/admin/merchant/*`) is for the merchant's own dashboard, not for shoppers.

"Scoped" means the response is limited to the merchant's sales channel by the publishable key.

| Need | Endpoint | Scoped to merchant? | Notes |
| --- | --- | --- | --- |
| Product list | `GET /store/products` | Yes | Accepts `category_id[]`, `q`, `limit`, `offset`, `fields`. Pass `region_id` to get calculated prices. |
| Product detail | `GET /store/products/:id` (or list with `handle=`) | Yes | A product outside the channel returns not found. |
| Search | `POST /store/search` | Partly | Product index only. Each hit carries `sales_channel_ids`; filter on the merchant's channel id. |
| Categories | `GET /store/merchant/categories` | **Yes** | Only the key's merchant, plain handles, with product counts. Use it for menus. See section 5. |
| Footer | GET /store/merchant/footer | Yes | Footer name, description, the switched-on social links, up to 5 Shop categories and the list of support pages that have text. Null text means use your own default. See the footer rule in section 7. |
| Support page | GET /store/merchant/pages/:slug | Yes | slug is contact, shipping, returns, privacy or terms. Answers { slug, title, text, blocks }; draw blocks (headings, paragraphs, nested lists, links), see the footer rule in section 7. A page the merchant has not written is a 404. Show it at /pages/\[slug\]. |
| Collections | `GET /store/collections` | **No** | Global. Do not use for navigation. |
| Regions | `GET /store/regions` | Global by design | Needed for currency and country routing. |
| Cart create | `POST /store/carts` | Yes | The channel is taken from the key. Never send another merchant's channel id. |
| Cart update, line items | `/store/carts/:id/...` | Yes | Inherits the cart's channel. |
| Shipping options | `GET /store/shipping-options?cart_id=` | Yes | Resolved through the channel's stock location. Empty until fulfillment is set up (section 6). |
| Payment | `POST /store/payment-collections`, `.../payment-sessions` | Yes | Needs a payment provider on the region. |
| Complete order | `POST /store/carts/:id/complete` | Yes | The order lands in the merchant's portal Orders page. |
| Customer auth | `/auth/customer/emailpass` | **No** | Customers are global. |
| Customer profile | `/store/customers/me` | **No** | Global. |
| Customer orders | `GET /store/orders` | **Yes** | A backend middleware limits it to the merchant of the key. Verified live. |

### Product field tip

For product cards and detail pages request:

`fields=*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata`

The product detail page also needs the options, so there add \*options,\*options.values,\*variants.options to the same fields list. Each variant then carries options: \[{ option\_id, value }\] and each product option carries id, title and values: \[{ id, value }\].

To filter by a category, pass its id: `GET /store/products?category_id[]=pcat_...`.

**Listing every product.** Without a limit, Medusa returns only the first 50 products, so a merchant with more silently loses the rest. To list the whole catalog, page with `limit=100` and an increasing `offset` until `count` is reached (stop at 500 products). The store API cannot filter or sort by price, so do price filters and sorting in the browser on the loaded list. Add `*options,*options.values,*variants.options,+created_at` to the fields when you need option filters or a newest-first sort.

## 5. Categories and customers

Products, carts and orders are isolated per merchant by the sales channel. Categories and customers are not, and a storefront has to handle both.

### Categories

- Each merchant owns their own categories. Ownership is a link between the sales channel and the category; the portal and `/admin/merchant/categories` enforce it, so one merchant can never edit or delete another's category.
- The stored handle is prefixed: `<sales_channel_id lowercased>--<slug>`, for example `sc_01abc--electronics`. Two merchants can both have "Electronics" without clashing. The portal strips the prefix before showing it.
- `GET /store/product-categories` returns **every** merchant's categories. A storefront must not render that list as its menu.

**Rule for the agent:** build navigation from `GET /store/merchant/categories`. It finds the merchant from the publishable key and returns only that merchant's active categories, each with `id`, `name`, `handle` (plain, no channel prefix), `description`, `rank` and `product_count`, sorted by rank then name. Use `handle` in storefront URLs and filter product lists with `category_id[]=<id>`. Verified live: two different keys each returned only their own merchant's category.

**Options:** `?handle=<handle>` returns a single category, and `?hide_empty=true` leaves out categories that have no published products. The response is `{ "categories": [...], "count": n }`. Product counts include published products of this merchant only, each counted once per category.

Categories that existed before the merchant-only change (Shirts, Pants and similar) are not linked to any merchant. They show up in the global list but belong to nobody.

### Customers

- Customers are one global table. An email registered on one merchant's storefront is the same account on every other storefront.
- Customers have no sales channel link. A merchant's portal Customers page can only show people who ordered from that merchant.
- `GET /store/orders` shows a shopper only the orders of the merchant whose publishable key is on the request. A shopper who bought from two merchants sees only the matching orders on each storefront. The backend enforces this, not the storefront.

**Rule for the agent:** call `GET /store/orders` and show what it returns. No client-side filtering is needed, and a client filter must never be relied on for privacy.

**Done and verified live:** the backend limits `GET /store/orders` and `GET /store/orders/:id` to the merchant of the publishable key. With one shopper who ordered from two merchants, each key saw only its own order, and fetching the other merchant's order by id answered not found.

**Also verified live:** `GET /store/merchant/categories` returned only the key's own merchant category, with the plain handle and the correct product count, for two different keys. With this route there are no open backend gaps for the storefront agent beyond the manual items in the list above.

**Storefront template verified live:** two storefronts (ZARA and ALR) built from the same template, each with its own publishable key, ran side by side. Verified: guest checkout, register, login, a guest cart carried into a login, the existing-email message, and logged-in orders. With the same email on both stores, each store's "My orders" and each merchant portal showed only its own orders.

### Orders and inventory

Orders carry `sales_channel_id` and appear only in the owning merchant's portal. Stock is tracked per merchant stock location; inventory shown on the storefront reflects that location only.

How the portal saves a product (what the storefront can rely on). A price must be a number of zero or more and a stock quantity a whole number of zero or more; the portal refuses anything else with a clear message, so a price of 0 or a stock of 0 always means the merchant entered it, never that a field was left empty. Creating a product is all or nothing: if its stock cannot be set, the product is removed again and the merchant sees an error, so a storefront never meets a new product without stock. When an existing product is edited and only its price or stock fails, the other changes are kept and the merchant is told which part to save again; the storefront simply shows what is saved at that moment. A storefront treats a stock of 0 as out of stock and never shows its own error for these cases.

Options and variants. A product has either one variant with no real options (Medusa's placeholder option is called "Default Option" with the value "Default", and the variant is titled "Default"), or several variants built from options such as Size and Color. The merchant adds the options in the portal, the portal lists every combination, and each combination (one variant) has its own price and stock. Limits: 3 options, 20 values per option, 100 variants, names up to 40 characters. There is no SKU field, because a Medusa SKU is unique across all merchants: a storefront must never show or rely on one. Verified live: creating a product with options (Color and Storage) in the portal, loading it for edit, the option buttons on the storefront, two variants with different prices in the cart, and a cash-on-delivery order with both. Also verified live: converting an old product to options, editing a saved product's variants, and the refusal when a combination with an undelivered order is switched off (a combination without orders switches off normally). Also confirmed live: setting a combination's stock to 0 makes the storefront show it as sold out (greyed out), and a combination with an undelivered order can only be removed after that order is fulfilled. Order lines carry variant\_title, so the checkout summary, order confirmation and order pages should show it next to the product name.

How a storefront picks a variant. Show the picker only when the product has more than one variant. Build one row of buttons per option from product.options (skip "Default Option"), read each variant's choice from variant.options (option\_id and value), find the variant whose values match what the shopper chose, and send that variant's id as variant\_id when adding to the cart. Grey out a button when no variant with that value can be bought together with the other choices made: its stock is 0, or the combination does not exist, because a merchant can leave combinations out. Price and stock come from the chosen variant's calculated\_price and inventory\_quantity. On product cards show "From" and the lowest price when the variants do not all cost the same, and send the shopper to the product page ("Choose options") unless the product has exactly one variant in stock. In the cart show variant\_title (for example "M / Black") but not the placeholder titles "Default", "Default Variant" or "Default Option".

What happens when a merchant edits options. Adding or removing values, or switching a combination off, only touches those variants. Adding an option keeps every existing variant and moves it to its new combination (S becomes S / Black), with the prices and stock the merchant sees in the portal. A product that had no options keeps Medusa's placeholder option "Default Option" after it gets real ones: every variant keeps the value "Default" for it, and a storefront must not show it (hide any option titled "Default Option"). Removing or renaming an option replaces all variants of that product with new ids. Medusa refuses to delete a variant while an order that is not delivered yet has stock reserved for it, so removing a combination, or removing or renaming an option, is refused with a message in that case; nothing is changed, and the merchant can keep the combination at stock 0 or wait until the orders are delivered. Orders already placed keep their details, but a cart that still holds a deleted variant fails on its next change or at completion. When an add-to-cart, update or complete call fails for that reason, reload the product, drop the line and ask the shopper to choose again. A save that stops half way is finished by saving again, and the portal tells the merchant which part to save again.

## 6. Checkout prerequisites and known gaps

The merchants that exist today (checked on the live store) already have shipping options and a Tunisie region in TND, so their carts list shipping. Before this was automated, a new merchant needed delivery set up by hand. Provisioning now also creates a fulfillment set, a delivery zone for Tunisia and one Standard Shipping option, and new products get the default shipping profile. Verified on the live store: products created in the portal after the patch complete checkout, for three merchants that were all set up by hand in the admin (three test orders, each landing in its own merchant's sales channel). The automatic setup in POST /admin/merchants has also been run on the live store: a merchant created that way got a Standard Shipping option in TND for Tunisia, its portal worked, and a test order on it completed. Products created before the patch had no shipping profile and failed at order completion.

### What checkout needs (verified against Medusa 2.21.2)

| Step | Needs | Set up for new merchants? |
| --- | --- | --- |
| Prices in the right currency | Store currency and a region containing the shopper's country | Shared: a TND region (Tunisie) exists |
| List shipping options | Cart channel → stock location → fulfillment set → service zone → shipping option | **Yes, since the delivery patch** |
| Match shipping to items | Each product linked to a shipping profile that a selected option uses | **Yes, since the delivery patch** (older products are covered by the backfill script) |
| Pay | A payment provider enabled on the region | Shared (system default only) |

**Consequence:** for a merchant with no fulfillment set, `GET /store/shipping-options?cart_id=` returns an empty list. Completing a cart also fails with "The cart items require shipping profiles that are not satisfied" when the products have no shipping profile.

### Gap list

1. **Per-merchant fulfillment was not provisioned (fixed for new merchants).** New merchants now get a fulfillment set, a Tunisia delivery zone and one Standard Shipping option at a fixed price. Merchants now manage delivery themselves in the portal under Settings: they rename options, change prices, switch options on or off, and add or delete options (verified live). Changing the countries is not yet possible.
2. **Products had no shipping profile (fixed).** New products get the default profile. Verified: orders complete for products created after the patch.
3. **Store CORS is manual** and needs a redeploy for each new storefront domain.
4. **Currency is TND for Tunisia.** The seed defines EUR and USD only. The live store already has a Tunisie region in TND. Storefronts must read the currency from the region and price, never hard-coded.
5. **Payment.** Only the system default provider is guaranteed. Card payments need a provider (for example Stripe) enabled on the region and its publishable key in the storefront env.
6. **Platform categories** from before the merchant-only change are unowned.

Items 1 and 2 were the ones that blocked a real sale for new merchants; the rest are polish or hardening.

## 7. Instructions for the AI agent

Give the agent this section as its brief, together with the merchant's `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` and sales channel id.

### Rules

1. Start from the verified reference storefront, a standalone Next.js app at `https://github.com/editingsclae/example-zara-storefront`. Copy it for each merchant and change only the environment variables (backend URL, publishable key, store name) and the design. All backend calls live in one file, `src/lib/medusa.ts`. The Medusa DTC starter can also be used, but this template is the one verified against this backend.
2. Use only `/store/*` and `/auth/customer/*`. Never call `/admin/*` and never put a secret key in the storefront.
3. Always send the publishable key (the SDK does this when `publishableKey` is set).
4. Never pass a `sales_channel_id` in a cart body; the key decides it.
5. Build menus from `GET /store/merchant/categories`. Do not use `/store/product-categories` or `/store/collections` for navigation: the first lists every merchant's categories with prefixed handles.
6. On the customer account page, call `GET /store/orders` and show what it returns; the backend already limits it to this merchant.
7. Format prices from `calculated_price` with the region's currency; never hard-code a currency.
8. Keep one merchant per storefront deployment. One codebase can serve many merchants only by reading a different key per deployment.
9. If the shipping options list comes back empty, show a clear "shipping is not set up yet" message instead of failing silently; this is a backend setup problem, not a storefront bug.
10. Registration is three calls: `POST /auth/customer/emailpass/register`, then `POST /store/customers` with that token, then log in again with `POST /auth/customer/emailpass` and keep the new token. The registration token is not a customer token: with it `GET /store/orders` answers Unauthorized and a page refresh logs the shopper out.
11. Keep the customer token in the browser's local storage only, and send it as `Authorization: Bearer <token>`. Do not copy it into a cookie: nothing on the storefront server reads it, and a cookie travels with every request to the storefront. If an earlier version wrote a `medusa_customer_token` cookie, expire it when the page loads.
12. Accounts are shared by all merchants. If registration says the email already exists, show "You already have an account with this email. Log in instead." with a link to the login page.
13. When a customer token exists and the cart has no `customer_id` (a cart started as a guest), call `POST /store/carts/:id/customer` after login and again just before completing the cart. Without it the order is created without a customer and does not appear in "My orders". A guest checkout creates a separate guest customer; the guest's earlier orders are linked to a later account by the claim-orders route (see the agent rules), which moves them once the account's email is confirmed with a code.
14. Every storefront origin must be listed in `STORE_CORS` and `AUTH_CORS` on the backend, and the backend redeployed. A "Failed to fetch" on login or on store calls from a new origin (including `http://localhost:3001`) means the origin is missing.
15. The production backend must set `JWT_SECRET` and `COOKIE_SECRET` to long random values, never the template default `supersecret`. Changing them signs every user out once. A storefront needs neither of them: its only settings are `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STORE_NAME`.
16. Payment is cash on delivery only (`pp_system_default`). Say "Cash on delivery" and "Pay when you receive your order"; never show card wording. Require a phone number and a city at checkout. In the portal the merchant moves an order through Fulfill, Shipped, Delivered and then Capture payment; until the payment is captured the order shows payment as awaiting. Show shoppers a derived status (Order placed, Shipped, Delivered), not the raw order status, and show `Order #<display_id>`, not the internal id.
17. Delivery options belong to the merchant and change at any time. Always list them from the cart's shipping options (Store API, with the cart id), never hardcode a name or price. An option the merchant switched off does not appear; a price of 0 is free delivery (show "Free"). Show the price the API returns for the cart.
18. Link a guest's earlier orders to the account. Linking needs a confirmed email (see Email confirmation). Whenever the logged in account's email is confirmed (right after the code is accepted, and at every login or page load while it is confirmed), call POST /store/merchant/claim-orders with the customer token and the publishable key and an empty body {}. The backend moves every order that was placed as a guest with the same email in this merchant, including orders placed on another device or before the account existed, and answers { claimed, already\_yours }. Optionally send { order\_ids: \[...\] } (1 to 20 ids) to move only those. Until the email is confirmed the route answers 403 { code: "email\_not\_verified" }: do not call it before that, and never show it as an error. Ignore any other failure so login still works. Never link by email without a confirmed email: anyone could register with someone else's email and read their orders. Remembering order ids in the browser is no longer needed.
19. Pages a storefront needs: a landing page (hero, category tiles, newest products and a link to Shop), /shop (the whole catalog with filters), /c/\[handle\] (the same shop view with that category fixed), /p/\[handle\] (gallery with clickable thumbnails, one row of option buttons per option (Size, Color), add to cart, related products, page title and share image from the product), a cart drawer plus a full /cart page, checkout, order confirmation, account with orders, and 404, error and loading pages. Use the store name from configuration everywhere, never a hardcoded merchant name.
20. Shop page filters. Load the whole catalog once on the server (see Listing every product) and filter and sort in the browser so it is instant: search (case and accent insensitive on title, subtitle and description), categories with counts, price range, in stock only, product options such as size and colour (only options with two or more values), and sort by newest, price up, price down and name. Keep the filter state in the URL query string (q, category, min, max, stock, sort, opt\_\<Title>) so a filtered view can be shared. Update the URL with window.history.replaceState, never router.replace: router.replace makes Next.js refetch the whole catalog from the backend on every keystroke or click. Paginate the filtered and sorted list in the browser: 15 products per page with numbered pagination (Previous, page numbers with gaps such as 1 … 9 10 11 … 20, Next; on phones "Page 2 of 5" between the arrows; nothing at all when everything fits on one page). Keep the page in the URL as ?page=N (leave it out for page 1) so the browser Back button from a product returns to the same page. Any change to the search, filters or sort goes back to page 1. A missing, invalid or too large page number falls back to page 1 or the last page, never an empty list. Changing page scrolls to the top of the results and respects reduced motion. Show the range in the count (16–30 of 47 products). The category pages use the same list component, so they paginate the same way. Never use a Load more button.
21. Cart drawer. A right-hand drawer that opens when an item is added and when the header cart button is clicked (on /cart and /checkout the button is a normal link). It shows each line with thumbnail, quantity stepper, remove and line total, the subtotal, and Checkout and View cart buttons, with an empty state. It closes on Esc, on an overlay click and on navigation, locks body scroll while open, and returns focus to the cart button only after it was open (not on first render). Show a quantity error from the API under its line. Product cards offer Add to cart only for a single in-stock variant; otherwise they link to the product page.
22. Header layout. Two rows. Row 1: store name on the left, a wide search bar with a search button in the middle (it goes to /shop?q=), account and cart on the right. Row 2: an All Categories button that opens a dropdown listing every category, then Home, Shop and only the first 5 categories (the first 3 from the lg breakpoint, all 5 from xl). Never list all categories in the top bar: a merchant with many categories overflows the page. Category links may be up to 14rem wide so common names are not cut off. On mobile use a menu button with search, Home, Shop and the category list inside it. The dropdown closes on an outside click, on Esc and when a link is chosen.
23. Landing page banners. The merchant edits them in the portal (Settings > Appearance); a storefront never hardcodes banner images or texts. Read them with GET /store/merchant/storefront (publishable key only). The answer is { hero\_slides: \[...\], promo\_banners: \[...\], category\_tiles: \[...\] }: up to 3 slides, promo banners (only the ones switched on, at most as many as the storefront declared, see below) and 8 category tiles, all in display order. A banner is { id, image\_url, label, title, text, button\_label, link } where label is a small badge or collection name, and link is { type: "none" | "shop" | "category" | "product", handle? }. Map a link to /shop, /c/\<handle> (strip the sales channel prefix with cleanCategoryHandle) or /p/\<handle>; never link elsewhere. Hero: a slider that moves by itself every 6 seconds, pauses on hover and focus, stays still for reduced motion, with arrows and dots, text over the image on the left with a dark gradient, and the whole slide is the link when there is no button text. Promo banners: shown after New Arrivals, arranged to fit the number of places this design has. The Zara design has 2, side by side, and shows a single banner full width; another design with 3 or more places arranges them its own way (a row, a grid or a mosaic), and every place must still look right when the merchant fills only some of them. The number of promo banner places differs from store to store (one design has 2, another 3, another 6), so the storefront declares its own number and the portal shows exactly that many places. When the server starts (Next.js src/instrumentation.ts, run once per start, not awaited, never allowed to throw) the storefront sends PUT /store/merchant/storefront/layout with the headers x-publishable-api-key and x-layout-key and the body { "promo\_banners": N } (plus the optional "sections" list, see the home page product sections item below), N a whole number from 0 to 12 (0 = this design has no promo place). The layout key is a secret: the merchant creates it in the portal (Appearance > Promo banners > Storefront connection), it is shown once, and it goes in a server-side environment variable named STOREFRONT\_LAYOUT\_KEY, never one starting with NEXT\_PUBLIC\_. Without it nothing is declared and the store keeps 2 places. The portal cannot see a storefront's layout, it can only believe what the storefront declares, so the declaration must always be true: N must equal the number of promo places the page really draws, and the page must never draw more than N. Keep N in ONE constant (for example LAYOUT.promo\_banners in src/lib/declare-layout.ts) and use that same constant in both places: in the declaration, and in the promo component, which shows at most the first N banners it receives (banners.slice(0, N)). Never change N alone: a new place is first built into the page, then N is raised. The API also never sends more than N banners, but do not rely on that alone, because a page that draws more than it declared breaks its own layout (a lonely extra banner on a new row). A wrong key gets 401, and a new key replaces the old one. Category tiles: an entry is { id, category\_id, name, handle, image\_url } where handle is already the public category handle, so link to /c/\<handle>. Show them in a Shop by Category section directly under the hero: round pictures with the category name underneath, 4 per row on phones and a single row from the lg breakpoint, in the given order. The merchant picks the categories and uploads the pictures in the portal, so never choose categories or pictures yourself; the API already leaves out tiles of deleted or switched off categories. With no tiles keep the plain list of category cards. With no slides keep a simple welcome banner; with no promo banners show nothing; if the request fails use the same defaults. Fetch the banners with cache: "no-store". A 60 second cache makes the old banner appear for several refreshes after the merchant changes it.
24. Home page product sections (New Arrivals, Best Sellers, Trending Now, Featured Products). Never build these rows by filtering products in the storefront: the backend decides which products go in each, and the merchant controls the titles and the Featured picks in the portal (Appearance > Product sections). Declare the sections together with the promo places: add "sections": \[{ "key": "new\_arrivals", "count": 8 }, { "key": "best\_sellers", "count": 4 }, ...\] to the same PUT /store/merchant/storefront/layout body. The keys are new\_arrivals, best\_sellers, trending and featured; the list is the order of the page; count (1 to 24) is the most products a row shows; leave out a key and the portal offers nothing for it. Same rule as the promo banners: the declaration must be true. Keep the list in ONE constant (for example SECTIONS in src/lib/declare-layout.ts) that is both sent to the backend and used to draw the page, and draw only the sections in that list, in that order, with at most count products each. Read them with GET /store/merchant/storefront/sections (publishable key only). The answer is { declared, sections: \[{ key, title, product\_ids }\] }. While declared is false (the storefront has not declared its sections yet, or the request failed) show the plain New Arrivals row (the 8 newest products from GET /store/products with order -created\_at). Once declared is true draw exactly the sections returned, even when there are none: a merchant who switched a row off, or a store with too few sales for Best Sellers or Trending Now (fewer than 3 products, or fewer than count when count is smaller), gets no such row, so never fill a row yourself and never draw an empty one. title is the merchant's title: show it as the heading. product\_ids are in display order: load them in ONE request, GET /store/products?id\[\]=...&region\_id=...&limit=\<number of ids> with the same fields as every other product list (calculated prices, inventory\_quantity, options), then put the products back in the order of product\_ids and leave out any id that did not come back. Sold out products can appear in the rows; the product card already shows them as sold out. How the products are chosen, for your information only: New Arrivals are the newest published products; Best Sellers are the most units sold in the last 90 days (in all orders when fewer than 3 products sold in that time); Trending Now the most units sold in the last 14 days; Featured the merchant's own choice, at most count. Orders that were canceled or are drafts never count. Where the rows sit on the page is the design's choice (for example after Shop by Category, or with the promo banners between two rows); keep the order of the list you declared. Shop all products is a button under the last row (link to /shop), never a section of its own. Fetch with cache: "no-store" like the banners.
25. Product badges (the small "New", "Bestseller", "Sale" pill on a product card). The merchant chooses the badge of each product in the portal (the Badge section of the product form: None, New, Bestseller, Sale, Limited, or a text of their own, at most 16 characters), and it is stored in the product's own metadata. It arrives with the product: ask for +metadata in the fields of every /store/products request (cards, lists, search) and read metadata.badge. If it is a non-empty string of at most 16 characters, draw it as a small pill on the product picture (top left in Zara; the design decides the look and the corner, and keep it clear of the sold out or only N left badge); if it is missing or empty draw nothing. Show the text exactly as it is: never translate it, never invent a badge, and never derive one yourself (no automatic New, Sale or Bestseller). Do not use Medusa product tags for this: tags are shared by all merchants. A merchant that wants a Bestseller or Featured row uses the home page product sections instead.
26. Footer. The merchant edits it in the portal (Settings > Footer); a storefront never hardcodes the footer name, description, social links, Shop column or support pages. Read the footer with GET /store/merchant/footer (publishable key only). The answer is { store\_name: string | null, description: string | null, social\_links: \[{ network: "tiktok" | "facebook" | "instagram", url }\], shop\_categories: \[{ id, name, handle }\], pages: \[{ slug, title }\] }. Layout (like a typical store footer): on the left the store name, the description and the social icons; on the right a Shop column and a Support column; below a thin line with the copyright. Name and description: show store\_name as the footer name and in the copyright line, and description under it; when one is null use the storefront's own name or text, never an empty line. Social: social\_links holds only the networks the merchant switched on and gave a link for, always in the order tiktok, facebook, instagram; url is a full https address on that network's own site. Show a small icon per network (give each link an accessible name: TikTok, Facebook, Instagram), open it in a new tab with rel="noopener noreferrer", and render no social row when the list is empty. Render only these three networks and only http(s) links, even if the response ever holds something else. Shop column: shop\_categories holds up to 5 categories the merchant picked, in the merchant's order, and one that was deleted or switched off is already left out. handle is the public category handle, so link to /c/\<handle> (strip any sales channel prefix with cleanCategoryHandle to be safe). With none, show a single link "All products" to /shop so the column is never empty. Support column: pages lists only the support pages that have text, always in the order contact (Contact Us), shipping (Shipping), returns (Returns), privacy (Privacy Policy), terms (Terms of Service). Link each to /pages/\<slug>, and show the column only when the list is not empty. The page itself is a storefront route /pages/\[slug\] that reads GET /store/merchant/pages/\<slug>, which answers { slug, title, text, blocks }. The merchant writes the page in the portal or pastes it from an AI assistant, with headings, bold text, nested lists and links, and the backend turns it into blocks: draw blocks, never text, so every storefront shows the same layout. Block types: heading { level: 1 | 2 | 3, content }, paragraph { content }, list { ordered, items: \[{ content, children: \[list\] }\] } (nested lists up to 4 deep) and rule {}. content is a list of inline pieces: { type: "text", text, bold?, italic? }, { type: "break" } (a line break inside a paragraph) and { type: "link", href, children: \[text pieces\] } where href is https, http, mailto: or tel:. Draw it with React elements, never as HTML (no dangerouslySetInnerHTML). The page title is already the page's h1, so draw a text heading of level 1 as an h2, level 2 as an h3 and level 3 as an h4, and skip a first heading that repeats the page title (merchants often start with it). Open https links in a new tab with rel="noopener noreferrer"; mailto and tel links open normally. Ignore any block or piece whose type you do not know and any link with another address. If blocks is missing or empty, fall back to text: a blank line starts a paragraph and a single line break stays a line break. Make a 404 a normal not found page. Only call the endpoint for the five known slugs; treat a backend failure as an error page, not as not found. The footer name is display text only: it does not rename the store anywhere else (header, emails, browser title). If the footer request fails use the defaults (store name, "Cash on delivery across Tunisia.", no social row, the All products link, no Support column) and still show the page. Fetch both endpoints with cache: "no-store" so a change appears on the next refresh.
27. Order emails. The backend sends the shopper an order confirmation by itself when an order is placed (through Resend); a storefront builds nothing for it and never holds an email key. The email goes to the address typed at checkout, so the checkout form must ask for a valid email address and say that the confirmation is sent there. Guest orders get it too. It shows the store name as the sender name, the items, delivery, total, delivery address and Cash on delivery. A problem sending an email never stops an order from being placed.
28. Email confirmation. A shopper confirms the email of their account with a 6 digit code (not a link: every merchant has its own domain). All three routes need the customer token (Authorization: Bearer) and the publishable key. GET /store/merchant/email-verification answers { email, verified, code\_pending, can\_resend\_in, expires\_in } (seconds). POST /store/merchant/email-verification emails a new code in the name of the store and answers { sent: true, can\_resend\_in, expires\_in }, or { verified: true } when already confirmed; errors are { code, message }: 429 too\_soon or too\_many (with retry\_after seconds) and 503 email\_unavailable. POST /store/merchant/email-verification/confirm with { code } answers { verified: true }; errors: 400 invalid\_format, no\_code, code\_expired, wrong\_code (with attempts\_left) and 429 too\_many\_attempts. A code works for 15 minutes, 5 wrong tries cancel it, a new one can be asked for once a minute and 5 times an hour. Flow: after registration call POST once to send the first code (ignore a failure), and on the account page show a box with a numeric input (inputMode numeric, autocomplete one-time-code) that ignores spaces and dashes, a Confirm button, and a Resend button with a countdown from can\_resend\_in; after Confirm succeeds call claim-orders and reload the orders. Show a small Email confirmed badge next to the email once verified. Confirmation is per email address and shared by all merchants, because accounts are shared. An unconfirmed account can still log in and place orders: never block checkout on it. A storefront never stores or checks the flag itself; it asks GET /store/merchant/email-verification. Verified live: the code email arrives in a Gmail inbox from the store name on the getcardy.shop domain, and guest orders placed on another device are linked after confirming.
29. Password reset. A shopper who forgot the password resets it with a 6 digit code sent by email; never use Medusa's own /auth/customer/emailpass/reset-password flow, which only emits an event and sends nothing. Neither route needs a login, only the publishable key. POST /store/merchant/password-reset with { email } emails a code in the name of the store and always answers { sent: true, can\_resend\_in } (seconds), whether or not the email has an account, so show "If there is an account for \<email>, we sent a code" and nothing else. POST /store/merchant/password-reset/confirm with { email, code, password } answers { reset: true, email }; log the shopper in with the email returned there, because the provider matches the spelling used at registration. Errors are { code, message }: 400 weak\_password (password under 8 or over 128 characters) and 400 invalid\_code, which is the same for an unknown email, no code, a wrong code, an expired code and too many tries, so show "That code is not right or has expired" and offer to send a new code. The code rules are the same as for email confirmation (15 minutes, 5 wrong tries, a new code once a minute and 5 times an hour), and a reset code never works as a confirmation code or the other way round. A good reset also confirms the email. Page: /account/forgot-password in two steps (email, then code with new password and repeat password), a Resend button with a 60 second countdown, a link Use a different email, a Forgot password? link on the sign in page next to the password field, and a redirect to /account after the automatic login. Only shopper accounts are reset; merchant portal logins are never reset from a storefront. Existing sessions stay valid until their token expires.
30. No VAT is applied: the Tunisie region tax rate is 0, so the price a merchant enters is the price the shopper pays. Show a VAT row only when `tax_total` is above zero and never hard-code a rate. A merchant that is VAT-registered enters prices with VAT included and invoices on their own. For price rows use `item_subtotal`, `shipping_subtotal`, `tax_total` and `total`, and check that they add up.
31. Deployment: the template ships a `Dockerfile` and `output: "standalone"` in `next.config.ts`. In Dokploy use the Dockerfile build type and set the three `NEXT_PUBLIC_*` values as build arguments; they are baked in at build time, so changing them needs a rebuild, not a restart. Add the storefront's https domain to `STORE_CORS` and `AUTH_CORS` and redeploy the backend. Logout must clear the saved cart.

### New merchant checklist

| # | Task | Who |
| --- | --- | --- |
| 1 | Provision the merchant (`POST /admin/merchants`) from the portal's Merchants page (platform admin login) and copy the `publishable_key` and sales channel id | Platform admin |
| 2 | Delivery setup is automatic: pass countries and shipping\_price when provisioning, then check that shipping options appear | Platform admin |
| 3 | Confirm the region, currency and payment provider for the merchant's countries | Platform admin |
| 4 | Merchant adds products and categories in the portal | Merchant |
| 5 | Add the storefront origin to `STORE_CORS` and `AUTH_CORS` and redeploy the backend | Platform admin |
| 6 | Set the four storefront env vars and the channel id, then deploy | Agent or developer |
| 7 | Test: product list, add to cart, shipping options, order completion, order visible in the portal | Platform admin |

### Smoke test

```bash
curl -s https://api.getcardy.shop/store/products?limit=3 \
  -H "x-publishable-api-key: $PK"
```

Expected: only that merchant's published products. If products from another merchant appear, stop and check that the key is linked to exactly one sales channel.
