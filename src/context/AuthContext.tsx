"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Customer,
  claimGuestOrders,
  getCustomer,
  getEmailVerification,
  loginCustomer,
  registerCustomer,
  sendEmailVerification,
} from "@/lib/medusa";
import { forgetGuestOrders, getGuestOrderIds } from "@/lib/guest-orders";
import { isUnauthorizedError } from "@/logic";

interface AuthContextType {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
  // Whether the customer's email was confirmed with a code. null: not known
  // (not logged in yet, or the backend could not be reached).
  emailVerified: boolean | null;
  // Call after the code was accepted: links the guest orders of this email to
  // the account and updates emailVerified.
  markEmailVerified: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Moves the guest orders of the (confirmed) email to the account that is logged
// in, including orders placed on another device. Failure is ignored: the shopper
// can still shop, and the next login tries again.
async function claimOrders(token: string) {
  try {
    await claimGuestOrders(token);
    // They are linked now. Orders with another email can never be claimed from
    // this account, so there is no reason to keep their ids.
    forgetGuestOrders(getGuestOrderIds());
  } catch {
    // Try again at the next login
  }
}

// Asks the backend whether the email is confirmed. A confirmed account gets its
// guest orders linked straight away. Returns null when the backend cannot say.
async function syncEmailStatus(token: string): Promise<boolean | null> {
  try {
    const status = await getEmailVerification(token);
    if (status.verified) {
      await claimOrders(token);
    }
    return status.verified;
  } catch {
    return null;
  }
}

const TOKEN_KEY = "medusa_customer_token";
const CART_KEY = "medusa_cart_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  // Initialize token and customer asynchronously on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      // Earlier versions also copied the token into a cookie. Nothing reads it, and
      // a cookie travels with every request to the storefront, so it is removed
      // from browsers that still have it.
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) {
        setToken(saved);
        try {
          const cust = await getCustomer(saved);
          if (isMounted) {
            if (cust) {
              setCustomer(cust);
              // Not awaited: the page does not wait for the email check
              syncEmailStatus(saved).then((verified) => {
                if (isMounted) setEmailVerified(verified);
              });
            } else {
              localStorage.removeItem(TOKEN_KEY);
              document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
              localStorage.removeItem(CART_KEY);
              document.cookie = `${CART_KEY}=; path=/; max-age=0`;
              setToken(null);
            }
          }
        } catch (err) {
          if (isMounted) {
            setCustomer(null);
            if (isUnauthorizedError(err)) {
              localStorage.removeItem(TOKEN_KEY);
              document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
              localStorage.removeItem(CART_KEY);
              document.cookie = `${CART_KEY}=; path=/; max-age=0`;
              setToken(null);
            }
          }
        }
      }
      if (isMounted) setIsLoading(false);
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await loginCustomer(email, pass);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      setEmailVerified(await syncEmailStatus(res.token));
      const cust = await getCustomer(res.token);
      setCustomer(cust);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await registerCustomer(data);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      // The shopper can order without confirming, but a first code is sent now.
      // If the email cannot be sent the account page offers to send it again.
      try {
        await sendEmailVerification(res.token);
      } catch {
        // ignore
      }
      setEmailVerified(await syncEmailStatus(res.token));
      const cust = await getCustomer(res.token);
      setCustomer(cust || res.customer);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
    setEmailVerified(null);
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    localStorage.removeItem(CART_KEY);
    document.cookie = `${CART_KEY}=; path=/; max-age=0`;
  };

  const refreshCustomer = async () => {
    if (!token) return;
    try {
      const cust = await getCustomer(token);
      setCustomer(cust);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        logout();
      }
    }
  };

  const markEmailVerified = async () => {
    if (!token) return;
    await claimOrders(token);
    setEmailVerified(true);
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshCustomer,
        emailVerified,
        markEmailVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
