import { apiFetch } from "@/lib/api/client";
import type { ListingFilter } from "@/data/listing-filters";

export async function apiListListingFilters(): Promise<ListingFilter[]> {
  return apiFetch<ListingFilter[]>("/api/listing-filters", { public: true });
}
