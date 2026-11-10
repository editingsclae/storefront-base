"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useRegisterForm() {
  const router = useRouter();
  const { register, customer } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExistingAccount, setIsExistingAccount] = useState(false);

  useEffect(() => {
    if (customer) {
      router.push("/account");
    }
  }, [customer, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsExistingAccount(false);
    setIsSubmitting(true);

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      router.push("/account");
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("identity")
      ) {
        setIsExistingAccount(true);
        setError("You already have an account with this email.");
      } else {
        setIsExistingAccount(false);
        setError(msg || "Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}

