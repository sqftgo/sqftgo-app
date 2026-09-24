import type { DirectoryCategory } from "@/data/types";

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
