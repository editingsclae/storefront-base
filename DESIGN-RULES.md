# Storefront Architecture & Design Rules

This document outlines the architectural boundaries and rules for developing, maintaining, and restyling the storefront.

---

## 1. Two Layers: Separation of Logic and Design

The codebase is strictly separated into two decoupled layers:

### The Logic Layer (`src/logic/` and `src/lib/`)
- **Purpose**: Holds business rules, state machines, validation, calculations, API interactions, and React hooks.
- **Rules**:
  - Contains **NO JSX**, **NO Tailwind classes**, and **NO HTML markup**.
  - All customer hooks return plain data objects and event handlers.
  - Pure functions in `src/logic/` and `src/lib/` are fully testable without network access.
  - **Never touch this layer when restyling or redesigning the storefront**.

### The Design Layer (`src/components/` and `src/app/`)
- **Purpose**: Renders markup, layouts, styles, visual animations, and visual presentation.
- **Rules**:
  - Components and client pages only call hooks and render what is returned.
  - Uses Tailwind CSS classes directly in JSX.
  - Free to completely redesign, retheme, and rewrite markup without altering logic contracts.

---

## 2. Restyling & Redesign Guidelines

When creating a new visual theme or redesigning existing views:
1. **Preserve component contracts**: Keep component file names, exported component names, prop interfaces, and hook return destructuring intact.
2. **Edit Tailwind and JSX only**: Update markup hierarchy, responsive grid definitions, and Tailwind classes.
3. **Use Tailwind `@theme` in `globals.css`**: Configure colors, fonts, shadows, borders, and border radii in `src/app/globals.css` using standard Tailwind CSS v4 `@theme` tokens.
4. **No secondary CSS system**: Do not introduce CSS modules, styled-components, inline CSS style sheets, or third-party UI framework CSS systems. Convert any external or custom CSS into Tailwind classes.

---

## 3. Layout Constants (`src/lib/declare-layout.ts`)

The storefront layout is declared to the merchant backend at server start. The portal UI configures itself to match these exact places:

- **`LAYOUT.promo_banners`**: The maximum number of promo banner slots drawn on the homepage (e.g., 2).
- **`SECTIONS`**: The ordered list of homepage product sections (e.g. `new_arrivals`, `best_sellers`, `trending`, `featured`) and their maximum product counts.
- **`CATEGORY_TILE_PLACES`**: The maximum number of category tiles drawn by `CategoryTiles` (e.g., 8).

> **Crucial Rule**: Always update the constant and the markup component together. Changing the constant without changing the markup, or rendering more items than declared in the constant, will break layout synchronization.

---

## 4. Forbidden Patterns

The following patterns are strictly forbidden:
- **Direct import of Medusa client in components or client pages**:
  - Files in `src/components/`, `src/app/checkout/`, `src/app/account/`, and `src/app/cart/` must NEVER import from `@/lib/medusa` directly.
  - All shared types, utilities, and hooks must be imported from `@/logic`.
  - Enforced automatically by ESLint `no-restricted-imports`.
- **Calling `/admin/*` routes**:
  - The storefront is a public customer application. It must never call Medusa Admin routes.
- **Hardcoding merchant or store data**:
  - Never hardcode the store name, currency code, delivery option names or prices, product lists, categories, or merchant promotional text.
  - Always read from the API, environment configuration, or cart context.

---

## 5. Verification Protocol

Before committing or pushing any code:

1. **Automated Verification**:
   ```bash
   npm run check
   ```
   This runs ESLint (`npm run lint`), TypeScript typechecking (`npx tsc --noEmit`), and all unit tests (`npm test` via Vitest).

2. **Windows Webpack Build Verification**:
   ```bash
   npx next build --webpack
   ```
   > **Note for Windows**: Always build using `npx next build --webpack`. Next.js Turbopack with Tailwind v4 has a known native crash on Windows Node 24 environments.

3. **Manual Verification Checklist**:
   Follow the verification checklist in [docs/CHECKLIST.md](docs/CHECKLIST.md) before deploying.

