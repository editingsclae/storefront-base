"use client";

import React from "react";
import { Tag, X } from "lucide-react";
import { useCouponBox } from "@/logic/use-coupon";

// The box where a shopper types a coupon code, with the codes already applied below it.
// Used in the cart and at checkout.
export function CouponBox() {
  const { code, setCode, busy, error, applied, canApply, apply, remove } =
    useCouponBox();

  return (
    <div className="space-y-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void apply();
        }}
        className="flex gap-2"
      >
        <label htmlFor="coupon-code" className="sr-only">
          Coupon code
        </label>
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          autoComplete="off"
          autoCapitalize="characters"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs uppercase tracking-wide text-zinc-900 placeholder:normal-case placeholder:tracking-normal focus:border-zinc-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canApply}
          className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {busy ? "..." : "Apply"}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}

      {applied.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {applied.map((appliedCode) => (
            <li
              key={appliedCode}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 py-1 pl-2.5 pr-1.5 text-[11px] font-semibold text-emerald-700"
            >
              <Tag size={12} aria-hidden="true" />
              <span className="tracking-wide">{appliedCode}</span>
              <button
                type="button"
                onClick={() => void remove(appliedCode)}
                disabled={busy}
                aria-label={`Remove coupon ${appliedCode}`}
                className="rounded-full p-0.5 hover:bg-emerald-100 disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
