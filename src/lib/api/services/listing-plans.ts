import { apiFetch } from "@/lib/api/client";

export type ListingPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  priceInr: number;
  slots: number;
  isActive: boolean;
  sortOrder: number;
};

export type DealerListingQuota = {
  used: number;
  free: number;
  purchased: number;
  quota: number;
  remaining: number;
  atCap: boolean;
  unlimited?: boolean;
  checkoutPath: string;
};

export type ListingPackOrder = {
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string | null;
  planName: string;
  slots: number;
};

export function apiListListingPlans() {
  return apiFetch<ListingPlan[]>("/api/listing-plans");
}

export function apiGetListingQuota() {
  return apiFetch<DealerListingQuota>("/api/dealer/listing-quota");
}

export function apiCreateListingPackOrder(planId: string) {
  return apiFetch<ListingPackOrder>("/api/payments/razorpay/order", {
    method: "POST",
    body: { planId },
  });
}

export function apiVerifyListingPackPayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return apiFetch("/api/payments/razorpay/verify", {
    method: "POST",
    body: input,
  });
}
