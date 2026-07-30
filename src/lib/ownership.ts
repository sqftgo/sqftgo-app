import type { DirectoryProfile, Inquiry, Property, SiteVisit } from "@/data/types";

/** Prefer userId / ownerId; email fallback for legacy mock rows. */
export function ownsProperty(
  property: Property,
  opts: { userId?: string; email?: string },
): boolean {
  if (opts.userId && property.ownerId && property.ownerId === opts.userId) return true;
  if (opts.userId && property.brokerId && property.brokerId === opts.userId) return true;
  const email = opts.email?.trim().toLowerCase();
  if (!email) return false;
  if (property.brokerEmail?.toLowerCase() === email) return true;
  if (property.ownerEmail?.toLowerCase() === email) return true;
  return false;
}

export function ownsInquiry(
  inquiry: Inquiry,
  opts: { email?: string; ownedPropertyIds?: Set<string> },
): boolean {
  if (opts.ownedPropertyIds?.has(inquiry.propertyId)) return true;
  const email = opts.email?.trim().toLowerCase();
  if (email && inquiry.brokerEmail.toLowerCase() === email) return true;
  return false;
}

export function ownsVisit(
  visit: SiteVisit,
  opts: { email?: string; ownedPropertyIds?: Set<string> },
): boolean {
  if (opts.ownedPropertyIds?.has(visit.propertyId)) return true;
  const email = opts.email?.trim().toLowerCase();
  if (email && visit.brokerEmail.toLowerCase() === email) return true;
  return false;
}

export function ownsDirectory(
  profile: DirectoryProfile,
  opts: { userId?: string; email?: string },
): boolean {
  if (opts.userId && profile.userId && profile.userId === opts.userId) return true;
  const email = opts.email?.trim().toLowerCase();
  if (email && profile.email.toLowerCase() === email) return true;
  return false;
}

export function ownedPropertyIds(
  properties: Property[],
  opts: { userId?: string; email?: string },
): Set<string> {
  return new Set(properties.filter((p) => ownsProperty(p, opts)).map((p) => p.id));
}
