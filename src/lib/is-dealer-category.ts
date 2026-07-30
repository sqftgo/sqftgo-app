import type { DirectoryCategory } from "@/data/types";

/** Dealer-ish directory categories (vs pure services). */
const DEALER_CATEGORIES = new Set<DirectoryCategory>([
  "Agent & Broker",
  "Builder & Developer",
  "Property Consultant",
]);

export function isDealerCategory(category: DirectoryCategory): boolean {
  return DEALER_CATEGORIES.has(category);
}
