import { apiFetch } from "@/lib/api/client";

export type PartnerPlanId = "starter" | "professional" | "enterprise";

export type SubscriptionStatus =
  | "inactive"
  | "pending"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type DealerSubscriptionRecord = {
  id: string;
  planId: PartnerPlanId;
  status: SubscriptionStatus;
  billingCycle: string;
  amountPaise: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  razorpayPaymentId: string | null;
};

export type DealerSubscriptionPaymentRecord = {
  id: string;
  planId: PartnerPlanId;
  amountPaise: number;
  currency: string;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type SubscriptionOverview = {
  billingEnabled: boolean;
  razorpayKeyId: string | null;
  subscription: DealerSubscriptionRecord | null;
  recentPayments: DealerSubscriptionPaymentRecord[];
};

export type SubscriptionOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentRecordId: string;
  plan: { id: PartnerPlanId; name: string; amountPaise: number };
};

export async function apiGetSubscriptionOverview(): Promise<SubscriptionOverview> {
  return apiFetch<SubscriptionOverview>("/api/dealer/subscription");
}

export async function apiCreateSubscriptionOrder(
  planId: PartnerPlanId,
): Promise<SubscriptionOrder> {
  return apiFetch<SubscriptionOrder>("/api/dealer/subscription/order", {
    method: "POST",
    body: { planId },
  });
}

export async function apiVerifySubscriptionPayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ alreadyProcessed: boolean; subscription: DealerSubscriptionRecord | null }> {
  return apiFetch("/api/dealer/subscription/verify", {
    method: "POST",
    body: input,
  });
}
