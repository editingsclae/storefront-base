"use client";

import React from "react";
import { MailCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { CODE_LENGTH } from "@/lib/email-verification";
import { useEmailVerificationCard } from "@/logic/use-email-verification";

interface Props {
  email: string;
  // Called after the code was accepted and the orders were linked
  onVerified?: () => void;
}

// Asks the shopper to type the 6 digit code that was emailed. Shown while the
// email is not confirmed. Shopping is never blocked: an unconfirmed account can
// still place orders. Confirming links the orders placed as a guest with the
// same email to the account.
export default function EmailVerificationCard({ email, onVerified }: Props) {
  const {
    code,
    setCleanCode,
    busy,
    error,
    notice,
    wait,
    codeSent,
    inputRef,
    send,
    confirm,
    isComplete,
    resendButtonLabel,
  } = useEmailVerificationCard({ email, onVerified });

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <MailCheck size={20} className="text-amber-700 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-900">Confirm your email</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {codeSent
              ? `Enter the ${CODE_LENGTH} digit code we sent to ${email}.`
              : `We will email a ${CODE_LENGTH} digit code to ${email}.`}{" "}
            You can keep shopping without it. Confirming links your earlier
            guest orders to this account.
          </p>
        </div>
      </div>

      <form onSubmit={confirm} className="flex flex-col sm:flex-row gap-3">
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCleanCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH + 4}
          placeholder="123456"
          aria-label={`${CODE_LENGTH} digit confirmation code`}
          className="w-full sm:w-44 px-3 py-2 border border-zinc-300 rounded-md bg-white text-center font-mono text-lg tracking-[0.35em] text-zinc-900 focus:outline-none focus:border-zinc-900"
        />
        <button
          type="submit"
          disabled={busy !== null || !isComplete}
          className="px-4 py-2 rounded-md bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === "confirm" ? "Checking..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={send}
          disabled={busy !== null || wait > 0}
          className="px-4 py-2 rounded-md border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendButtonLabel}
        </button>
      </form>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {notice && !error && (
        <p role="status" className="flex items-start gap-2 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </p>
      )}
      <p className="text-[11px] text-zinc-500">
        Nothing in your inbox? Check the spam folder, then ask for a new code.
      </p>
    </div>
  );
}
