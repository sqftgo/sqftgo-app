import type { DirectoryCategory, DirectoryProfile } from "@/data/types";

/** Agents / consultants / builders shown on the Dealers directory (matches web). */
const DEALER_CATEGORIES = new Set<string>([
  "Agent & Broker",
  "Builder & Developer",
  "Property Consultant",
]);

export function isDealerCategory(
  category: DirectoryCategory | string,
): boolean {
  return DEALER_CATEGORIES.has(category);
}

/** Service directory: non-dealer trades (excludes agents, consultants, builders). */
export function isServiceDirectoryCategory(
  category: DirectoryCategory | string,
): boolean {
  return !isDealerCategory(category);
}

/** True when the partner should show the SqftGo verified badge. */
export function isDirectoryVerified(profile: DirectoryProfile): boolean {
  const status = (profile.verificationStatus ?? "").toLowerCase();
  if (status === "verified" || status === "approved") return true;
  // RERA is dealer-only proof; service partners use verificationStatus.
  if (!isServiceDirectoryCategory(profile.category) && Boolean(profile.reraId)) return true;
  return false;
}
