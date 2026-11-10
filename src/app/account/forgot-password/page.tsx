"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { STORE_NAME } from "@/logic";
import { CODE_LENGTH } from "@/lib/email-verification";
import { useForgotPassword } from "@/logic/use-forgot-password";

const FIELD =
  "w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900";
const LABEL = "block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1";

export default function ForgotPasswordPage() {
  const {
    customer,
    step,
    email,
    setEmail,
    code,
    setCleanCode,
    password,
    setPassword,
    repeat,
    setRepeat,
    busy,
    error,
    wait,
    changed,
    codeRef,
    sendCode,
    handleEmail,
    handleReset,
    handleUseDifferentEmail,
    resendLabelText,
  } = useForgotPassword();

  if (customer) {
    return null;
  }

  if (changed) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="border border-zinc-200 rounded-2xl p-8 bg-white shadow-sm space-y-4 text-center">
          <CheckCircle2 size={28} className="mx-auto text-emerald-600" />
          <h1 className="text-xl font-extrabold text-zinc-900">Password changed</h1>
          <p className="text-xs text-zinc-500">
            Sign in with your new password.
          </p>
          <Link
            href="/account/login"
            className="inline-block text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-black transition"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="border border-zinc-200 rounded-2xl p-8 bg-white shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-900 mb-2">
            <KeyRound size={18} />
          </div>
          <h1 className="text-xl font-extrabold text-zinc-900">Reset your password</h1>
          <p className="text-xs text-zinc-500">
            {step === "email"
              ? `Enter the email of your ${STORE_NAME} account and we will send you a code.`
              : `If there is an account for ${email.trim()}, we sent a ${CODE_LENGTH} digit code to it.`}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className={LABEL}>Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={FIELD}
              />
            </div>
            <button
              type="submit"
              disabled={busy !== null}
              className="w-full py-3 px-4 bg-zinc-900 text-white rounded-md font-semibold text-xs uppercase tracking-wider hover:bg-black disabled:bg-zinc-300 transition flex items-center justify-center gap-2"
            >
              <span>{busy === "send" ? "Sending..." : "Send code"}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className={LABEL}>Code from the email</label>
              <input
                ref={codeRef}
                value={code}
                onChange={(e) => setCleanCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH + 4}
                placeholder="123456"
                aria-label={`${CODE_LENGTH} digit code`}
                className={`${FIELD} text-center font-mono text-lg tracking-[0.35em]`}
              />
            </div>
            <div>
              <label className={LABEL}>New password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={FIELD}
              />
            </div>
            <div>
              <label className={LABEL}>Repeat new password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                placeholder="••••••••"
                className={FIELD}
              />
            </div>
            <button
              type="submit"
              disabled={busy !== null}
              className="w-full py-3 px-4 bg-zinc-900 text-white rounded-md font-semibold text-xs uppercase tracking-wider hover:bg-black disabled:bg-zinc-300 transition flex items-center justify-center gap-2"
            >
              <span>{busy === "reset" ? "Saving..." : "Change password"}</span>
              <ArrowRight size={14} />
            </button>
            <div className="flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={busy !== null || wait > 0}
                className="font-semibold text-zinc-700 hover:underline disabled:text-zinc-400 disabled:no-underline"
              >
                {busy === "send" ? "Sending..." : resendLabelText}
              </button>
              <button
                type="button"
                onClick={handleUseDifferentEmail}
                className="text-zinc-500 hover:underline"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-zinc-100 text-center text-xs text-zinc-500">
          Remembered it?{" "}
          <Link
            href="/account/login"
            className="font-bold text-zinc-900 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
