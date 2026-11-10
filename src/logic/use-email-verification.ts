"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  confirmEmailVerification,
  getEmailVerification,
  sendEmailVerification,
} from "@/lib/medusa";
import {
  CODE_LENGTH,
  cleanCodeInput,
  describeVerificationError,
  isCodeComplete,
  resendLabel,
} from "@/lib/email-verification";

export interface UseEmailVerificationCardOptions {
  email: string;
  onVerified?: () => void;
}

export function useEmailVerificationCard({
  email,
  onVerified,
}: UseEmailVerificationCardOptions) {
  const { token, markEmailVerified } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "confirm" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // How long until a new code can be asked for, and whether one is waiting
  useEffect(() => {
    if (!token) return;
    let current = true;
    getEmailVerification(token)
      .then((status) => {
        if (!current) return;
        setWait(status.can_resend_in);
        setCodeSent(status.code_pending);
      })
      .catch(() => {
        // The buttons still work; the backend answers with the real limits
      });
    return () => {
      current = false;
    };
  }, [token]);

  // Counts the pause down, one second at a time
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = useCallback(async () => {
    if (!token || busy) return;
    setBusy("send");
    setError(null);
    setNotice(null);
    try {
      const res = await sendEmailVerification(token);
      if (res.verified) {
        await markEmailVerified();
        onVerified?.();
        return;
      }
      setCodeSent(true);
      setWait(res.can_resend_in ?? 60);
      setNotice(`We sent a code to ${email}.`);
      inputRef.current?.focus();
    } catch (err) {
      const problem = describeVerificationError(err);
      setError(problem.message);
      if (problem.retryAfter) setWait(Math.ceil(problem.retryAfter));
    } finally {
      setBusy(null);
    }
  }, [token, busy, email, markEmailVerified, onVerified]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || busy) return;
    if (!isCodeComplete(code)) {
      setError(`Enter the ${CODE_LENGTH} digit code from the email.`);
      return;
    }
    setBusy("confirm");
    setError(null);
    setNotice(null);
    try {
      await confirmEmailVerification(token, code);
      await markEmailVerified();
      onVerified?.();
    } catch (err) {
      const problem = describeVerificationError(err);
      setError(problem.message);
      if (problem.clearCode) setCode("");
      setBusy(null);
    }
  };

  const setCleanCode = (val: string) => {
    setCode(cleanCodeInput(val));
  };

  const isComplete = isCodeComplete(code);
  const resendButtonLabel =
    busy === "send"
      ? "Sending..."
      : codeSent || wait > 0
      ? resendLabel(wait)
      : "Send code";

  return {
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
  };
}

