import { apiFetch } from "@/lib/api/client";
import type { DealerAnalytics, Inquiry, Property, SiteVisit } from "@/data/types";
import { ownsInquiry, ownsProperty, ownsVisit } from "@/lib/ownership";

export async function apiGetDealerAnalytics(): Promise<DealerAnalytics> {
  return apiFetch<DealerAnalytics>("/api/dealer/analytics");
}

/** Derive analytics locally when API mode is off. */
export function deriveDealerAnalytics(
  properties: Property[],
  inquiries: Inquiry[],
  visits: SiteVisit[],
  opts: { userId?: string; email?: string },
): DealerAnalytics {
  const mine = properties.filter((p) => ownsProperty(p, opts));
  const ownedIds = new Set(mine.map((p) => p.id));
  const myInquiries = inquiries.filter((i) =>
    ownsInquiry(i, { email: opts.email, ownedPropertyIds: ownedIds }),
  );
  const myVisits = visits.filter((v) =>
    ownsVisit(v, { email: opts.email, ownedPropertyIds: ownedIds }),
  );

  const cityMap = new Map<string, number>();
  for (const p of mine) {
    cityMap.set(p.city, (cityMap.get(p.city) ?? 0) + 1);
  }

  const monthMap = new Map<string, number>();
  for (const inq of myInquiries) {
    const month = inq.createdAt.slice(0, 7);
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  return {
    listingsTotal: mine.length,
    listingsActive: mine.filter((p) => p.status === "Active").length,
    listingsPending: mine.filter((p) => p.status === "Pending Review").length,
    listingsDraft: mine.filter((p) => p.status === "Draft").length,
    listingsRejected: mine.filter((p) => p.status === "Rejected").length,
    inquiriesTotal: myInquiries.length,
    visitsTotal: myVisits.length,
    visitsPending: myVisits.filter((v) => v.status === "pending").length,
    visitsConfirmed: myVisits.filter((v) => v.status === "confirmed").length,
    inventoryValueSum: mine.reduce((sum, p) => sum + (p.price || 0), 0),
    cityBreakdown: Array.from(cityMap.entries()).map(([city, count]) => ({ city, count })),
    monthlyInquiries: Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
    topListings: [...mine]
      .sort((a, b) => b.inquiryCount - a.inquiryCount)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        status: p.status,
        inquiryCount: p.inquiryCount,
      })),
    listings: mine.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      city: p.city,
      status: p.status,
      inquiryCount: p.inquiryCount,
      price: p.price,
    })),
  };
}
