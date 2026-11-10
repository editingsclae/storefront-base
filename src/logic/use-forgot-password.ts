"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "@/lib/medusa";
import {
  CODE_LENGTH,
  cleanCodeInput,
  isCodeComplete,
  resendLabel,
} from "@/lib/email-verification";
import {
  checkNewPassword,
  describeResetError,
  looksLikeEmail,
} from "@/lib/password-reset";

export function useForgotPassword() {
  const router = useRouter();
  const { login, customer } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState<"send" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [changed, setChanged] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customer) {
      router.push("/account");
    }
  }, [customer, router]);

  // Counts the pause before a new code can be asked for, one second at a time
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const sendCode = async () => {
    if (busy) return;
    if (!looksLikeEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy("send");
    setError(null);
    try {
      const res = await requestPasswordReset(email.trim());
      setStep("code");
      setWait(res.can_resend_in ?? 60);
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (err) {
      setError(describeResetError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    void sendCode();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!isCodeComplete(code)) {
      setError(`Enter the ${CODE_LENGTH} digit code from the email.`);
      return;
    }
    const passwordProblem = checkNewPassword(password, repeat);
    if (passwordProblem) {
      setError(passwordProblem);
      return;
    }

    setBusy("reset");
    setError(null);
    let loginEmail = email.trim();
    try {
      const res = await confirmPasswordReset({
        email: email.trim(),
        code,
        password,
      });
      loginEmail = res.email;
    } catch (err) {
      const problem = describeResetError(err);
      setError(problem.message);
      if (problem.clearCode) setCode("");
      setBusy(null);
      return;
    }

    // The password is changed. Log in with it; if that fails the shopper can
    // still sign in by hand.
    try {
      await login(loginEmail, password);
      router.push("/account");
    } catch {
      setChanged(true);
      setBusy(null);
    }
  };

  const setCleanCode = (val: string) => {
    setCode(cleanCodeInput(val));
  };

  const handleUseDifferentEmail = () => {
    setStep("email");
    setCode("");
    setError(null);
  };

  return {
    customer,
    step,
    setStep,
    email,
    setEmail,
    code,
    setCode,
    setCleanCode,
    password,
    setPassword,
    repeat,
    setRepeat,
    busy,
    error,
    setError,
    wait,
    changed,
    codeRef,
    sendCode,
    handleEmail,
    handleReset,
    handleUseDifferentEmail,
    resendLabelText: resendLabel(wait),
  };
}

