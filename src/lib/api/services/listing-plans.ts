import { apiFetch } from "@/lib/api/client";

/** PENDING: in-app Razorpay checkout. Dealers pay on the website until this lands. */

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
  checkoutPath: string;
};

export function apiListListingPlans() {
  return apiFetch<ListingPlan[]>("/api/listing-plans");
}

export function apiGetListingQuota() {
  return apiFetch<DealerListingQuota>("/api/dealer/listing-quota");
}
