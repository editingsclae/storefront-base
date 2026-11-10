import { describe, it, expect } from "vitest";
import { isUnauthorizedError } from "@/logic/auth-401";

describe("auth-401 isUnauthorizedError", () => {
  it("status 401 gives true", () => {
    expect(isUnauthorizedError({ status: 401 })).toBe(true);
    const err = new Error("Request failed with status 401");
    (err as unknown as { status: number }).status = 401;
    expect(isUnauthorizedError(err)).toBe(true);
  });

  it("status 500 gives false", () => {
    expect(isUnauthorizedError({ status: 500 })).toBe(false);
    const err = new Error("Internal server error");
    (err as unknown as { status: number }).status = 500;
    expect(isUnauthorizedError(err)).toBe(false);
  });

  it("a plain Error with the message 'Order 4012 failed' gives false", () => {
    const err = new Error("Order 4012 failed");
    expect(isUnauthorizedError(err)).toBe(false);
  });

  it("null and undefined give false", () => {
    expect(isUnauthorizedError(null)).toBe(false);
    expect(isUnauthorizedError(undefined)).toBe(false);
  });
});

