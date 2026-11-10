import React from "react";
import { showVariantTitle } from "@/logic";
import Link from "next/link";
import {
  getOrder,
  formatPrice,
  STORE_NAME,
  getDerivedOrderStatus,
  getDerivedPaymentStatus,
} from "@/lib/medusa";
import { CheckCircle2, PackageCheck, ArrowRight, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

interface OrderConfirmedPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmedPage({
  params,
}: OrderConfirmedPageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-zinc-900">Order Not Found</h1>
        <p className="text-xs text-zinc-500">
          The requested order ({id}) could not be retrieved for this merchant.
        </p>
        <Link
          href="/"
          className="inline-block text-xs font-semibold px-4 py-2 rounded-md bg-zinc-900 text-white"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const currencyCode = order.currency_code || "TND";

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Success Hero Header */}
      <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-8 text-center space-y-3">
        <CheckCircle2 size={52} className="mx-auto text-emerald-600" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-sm text-zinc-600 max-w-md mx-auto">
          Your order has been received and confirmed by <strong>{STORE_NAME}</strong>. We will notify you once your package ships.
        </p>
        <div className="pt-2 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-zinc-200 text-xs font-mono text-zinc-700">
          <span>Order:</span>
          <strong>#{order.display_id ?? order.id}</strong>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-zinc-500">Placed on: </span>
            <span className="font-semibold text-zinc-900">
              {new Date(order.created_at).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Confirmation sent to: </span>
            <span className="font-semibold text-zinc-900">{order.email}</span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase text-[10px]">
              {getDerivedOrderStatus(order)}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Items List */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3 flex items-center gap-1.5">
              <PackageCheck size={16} />
              <span>Ordered Items</span>
            </h2>
            <div className="divide-y divide-zinc-100 border-y border-zinc-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    {showVariantTitle(item.variant_title) && (
                      <p className="text-xs text-zinc-500">{item.variant_title}</p>
                    )}
                    <p className="text-xs text-zinc-500">
                      Qty: {item.quantity} &bull; Unit: {formatPrice(item.unit_price, currencyCode)}
                    </p>
                  </div>
                  <div className="font-mono font-semibold text-zinc-900">
                    {formatPrice(item.total || item.unit_price * item.quantity, currencyCode)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Shipping Destination
              </h3>
              {order.shipping_address ? (
                <div className="text-zinc-600 space-y-0.5">
                  <p className="font-semibold text-zinc-900">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.address_1}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.phone}</p>
                </div>
              ) : (
                <p className="text-zinc-400">Standard address</p>
              )}
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Fulfillment & Delivery
              </h3>
              <div className="text-zinc-600 space-y-0.5">
                <p className="font-semibold text-zinc-900">
                  {order.shipping_methods?.[0]?.name || "Aramex Standard Delivery"}
                </p>
                <p>Status: {getDerivedOrderStatus(order)}</p>
                <p>{getDerivedPaymentStatus(order)}</p>
                <p className="text-zinc-500 text-[11px]">Pay when you receive your order</p>
              </div>
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="pt-4 border-t border-zinc-200 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Items</span>
              <span className="font-mono">
                {formatPrice(
                  order.item_subtotal ??
                    (order.shipping_subtotal
                      ? order.subtotal - order.shipping_subtotal
                      : order.subtotal),
                  currencyCode
                )}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Shipping</span>
              <span className="font-mono">
                {formatPrice(order.shipping_subtotal ?? 0, currencyCode)}
              </span>
            </div>
            {order.tax_total !== undefined && order.tax_total > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>VAT</span>
                <span className="font-mono">
                  {formatPrice(order.tax_total, currencyCode)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-200">
              <span>Total</span>
              <span className="font-mono">{formatPrice(order.total, currencyCode)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-zinc-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-black transition"
        >
          <ShoppingBag size={15} />
          <span>Continue Shopping</span>
        </Link>
        <Link
          href="/account"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-zinc-300 text-zinc-800 font-semibold text-xs uppercase tracking-wider hover:bg-zinc-50 transition"
        >
          <span>View My Orders</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
