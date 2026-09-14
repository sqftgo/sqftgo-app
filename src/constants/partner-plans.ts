export type PartnerPlanId = "starter" | "professional" | "enterprise";

export type PartnerPlan = {
  id: PartnerPlanId;
  name: string;
  tagline: string;
  amountPaise: number;
  currency: "INR";
  periodLabel: string;
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
    tagline: "For solo brokers getting listed",
    amountPaise: 99_900,
    currency: "INR",
    periodLabel: "/month",
    listingLimit: 5,
    features: [
      "5 active listings",
      "Basic analytics",
      "Email support",
      "Public dealer profile",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Most teams grow here",
    amountPaise: 249_900,
    currency: "INR",
    periodLabel: "/month",
    listingLimit: 25,
    highlighted: true,
    badge: "Most popular",
    features: [
      "25 active listings",
      "Advanced analytics",
      "Priority support",
      "Featured listing slots",
      "RERA + verified badges",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Agencies that need headroom",
    amountPaise: 599_900,
    currency: "INR",
    periodLabel: "/month",
    listingLimit: null,
    badge: "Best value",
    features: [
      "Unlimited listings",
      "Full analytics suite",
      "Dedicated account manager",
      "API access",
      "All Professional features",
    ],
  },
];

export function formatPlanPrice(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}
