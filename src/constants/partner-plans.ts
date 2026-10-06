export type PartnerPlanId = "starter" | "professional" | "enterprise";

export type PartnerPlan = {
  id: PartnerPlanId;
  name: string;
  tagline: string;
  amountPaise: number;
  currency: "INR";
  periodLabel: string;
  billingDays: number;
  listingLimit: number | null;
  features: string[];
  highlighted?: boolean;
  badge?: string;
};

/** Amounts in paise — keep in sync with web `features/billing/plans.ts`. */
export const PARTNER_PLANS: PartnerPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Everything you need to list and grow",
    amountPaise: 9_900,
    currency: "INR",
    periodLabel: "/month",
    billingDays: 30,
    listingLimit: null,
    highlighted: true,
    badge: "All inclusive",
    features: [
      "Unlimited active listings",
      "Public dealer profile",
      "RERA & verified badges",
      "Advanced analytics",
      "Featured listing slots",
      "Priority support",
      "Extra listing packs",
    ],
  },
];

export function getPartnerPlan(id: string): PartnerPlan | undefined {
  return PARTNER_PLANS.find((p) => p.id === id);
}

export function formatPlanPrice(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}
