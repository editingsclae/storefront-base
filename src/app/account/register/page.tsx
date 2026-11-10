"use client";

import React from "react";
import Link from "next/link";
import { STORE_NAME } from "@/logic";
import { UserPlus, ArrowRight, AlertCircle } from "lucide-react";
import { useRegisterForm } from "@/logic/use-register-form";

export default function RegisterPage() {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    error,
    isExistingAccount,
    handleSubmit,
    customer,
  } = useRegisterForm();

  if (customer) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="border border-zinc-200 rounded-2xl p-8 bg-white shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-900 mb-2">
            <UserPlus size={18} />
          </div>
          <h1 className="text-xl font-extrabold text-zinc-900">
            Create an Account
          </h1>
          <p className="text-xs text-zinc-500">
            Join {STORE_NAME} to track orders and save your information.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <div>
              {isExistingAccount ? (
                <span>
                  You already have an account with this email.{" "}
                  <Link
                    href="/account/login"
                    className="font-bold underline text-rose-900 hover:text-black ml-1"
                  >
                    Log in instead.
                  </Link>
                </span>
              ) : (
                <span>{error}</span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

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
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
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
            <span>{isSubmitting ? "Creating Account..." : "Register"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/account/login"
            className="font-bold text-zinc-900 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
