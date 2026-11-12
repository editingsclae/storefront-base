import { describe, it, expect } from "vitest";
import { getDerivedOrderStatus, getDerivedPaymentStatus } from "@/lib/medusa";

describe("getDerivedOrderStatus", () => {
  it("a canceled order is Canceled, even when it was fulfilled", () => {
    expect(getDerivedOrderStatus({ status: "canceled", fulfillment_status: "not_fulfilled" })).toBe("Canceled");
    expect(getDerivedOrderStatus({ status: "canceled", fulfillment_status: "shipped" })).toBe("Canceled");
  });

  it("fulfillment_status canceled is Canceled", () => {
    expect(getDerivedOrderStatus({ status: "pending", fulfillment_status: "canceled" })).toBe("Canceled");
  });

  it("delivered and shipped", () => {
    expect(getDerivedOrderStatus({ status: "pending", fulfillment_status: "delivered" })).toBe("Delivered");
    expect(getDerivedOrderStatus({ status: "pending", fulfillment_status: "shipped" })).toBe("Shipped");
  });

  it("everything else is Order placed", () => {
    expect(getDerivedOrderStatus({ status: "pending", fulfillment_status: "not_fulfilled" })).toBe("Order placed");
    expect(getDerivedOrderStatus({ status: "pending", fulfillment_status: "fulfilled" })).toBe("Order placed");
    expect(getDerivedOrderStatus({})).toBe("Order placed");
  });
});

describe("getDerivedPaymentStatus", () => {
  it("a canceled order or payment is canceled", () => {
    expect(getDerivedPaymentStatus({ status: "canceled", payment_status: "awaiting" })).toBe("Payment: canceled");
    expect(getDerivedPaymentStatus({ payment_status: "canceled" })).toBe("Payment: canceled");
  });

  it("captured is received, otherwise pay on delivery", () => {
    expect(getDerivedPaymentStatus({ payment_status: "captured" })).toBe("Payment: received");
    expect(getDerivedPaymentStatus({ payment_status: "awaiting" })).toBe("Payment: pay on delivery");
    expect(getDerivedPaymentStatus({})).toBe("Payment: pay on delivery");
  });
});
