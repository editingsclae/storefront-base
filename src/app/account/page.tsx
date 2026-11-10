"use client";

import React from "react";
import Link from "next/link";
import EmailVerificationCard from "@/components/EmailVerificationCard";
import {
  formatPrice,
  STORE_NAME,
  getDerivedOrderStatus,
} from "@/logic";
import {
  Package,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { useAccountOrders } from "@/logic/use-account-orders";

export default function AccountPage() {
  const {
    customer,
    emailVerified,
    authLoading,
    orders,
    ordersLoading,
    reloadOrders,
    handleLogout,
  } = useAccountOrders();

  if (authLoading || (!customer && authLoading)) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 font-medium">Loading your account...</p>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Account Overview Header */}
      <div className="border border-zinc-200 rounded-2xl p-6 sm:p-8 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xl font-bold uppercase shadow-sm">
            {customer.first_name ? customer.first_name[0] : customer.email[0]}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
              {customer.first_name
                ? `${customer.first_name} ${customer.last_name || ""}`
                : "Customer Profile"}
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {customer.email}
            </p>
            {emailVerified === true && (
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
                <BadgeCheck size={13} />
                Email confirmed
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-md text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 hover:text-rose-600 transition self-start sm:self-auto"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Email confirmation: shown until the code was entered */}
      {emailVerified === false && (
        <EmailVerificationCard
          email={customer.email}
          onVerified={reloadOrders}
        />
      )}

      {/* Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-zinc-700" />
            <h2 className="text-lg font-bold text-zinc-900">My Orders</h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {orders.length} {orders.length === 1 ? "order" : "orders"} placed at {STORE_NAME}
          </span>
        </div>

        {/* Loading State */}
        {ordersLoading && (
          <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
            <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Fetching your orders from {STORE_NAME}...</p>
          </div>
        )}

        {/* Empty State */}
        {!ordersLoading && orders.length === 0 && (
          <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl space-y-3">
            <ShoppingBag size={40} className="mx-auto text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-800">No orders yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              You haven&apos;t placed any orders with {STORE_NAME} yet.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-black transition"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!ordersLoading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => {
              const currency = order.currency_code || "TND";
              return (
                <div
                  key={order.id}
                  className="border border-zinc-200 rounded-xl p-5 bg-white hover:border-zinc-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-zinc-900">
                        Order #{order.display_id ?? order.id}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {getDerivedOrderStatus(order)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </span>
                      <span>&bull;</span>
                      <span>{order.items?.length || 0} item(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                        Total
                      </p>
                      <p className="font-mono font-bold text-base text-zinc-900">
                        {formatPrice(order.total, currency)}
                      </p>
                    </div>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-zinc-600 transition bg-zinc-100 px-3 py-1.5 rounded-md"
                    >
                      <span>Details</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
