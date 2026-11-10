"use client";

import React from "react";
import Link from "next/link";
import { STORE_NAME } from "@/logic";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useLoginForm } from "@/logic/use-login-form";

export default function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    error,
    handleSubmit,
    customer,
  } = useLoginForm();

  if (customer) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="border border-zinc-200 rounded-2xl p-8 bg-white shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-900 mb-2">
            <Lock size={18} />
          </div>
          <h1 className="text-xl font-extrabold text-zinc-900">
            Sign in to {STORE_NAME}
          </h1>
          <p className="text-xs text-zinc-500">
            Access your orders, tracking, and account details.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                Password
              </label>
              <Link
                href="/account/forgot-password"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-zinc-900 text-white rounded-md font-semibold text-xs uppercase tracking-wider hover:bg-black disabled:bg-zinc-300 transition flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/account/register"
            className="font-bold text-zinc-900 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
