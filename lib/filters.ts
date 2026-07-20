import type { Property } from "@/data/types";

export type PurposeFilter = "all" | "buy" | "rent" | "commercial";
export type BhkFilter = "all" | 1 | 2 | 3 | 4 | 5;
export type PriceFilter = "all" | "under-50k" | "under-50L" | "under-2Cr" | "over-2Cr";
export type TypeFilter = "all" | "Villa" | "Apartment" | "Home" | "Industrial Plot";
export type FurnishingFilter = "all" | "Furnished" | "Semi-Furnished" | "Unfurnished";
export type SortOption = "relevance" | "price-asc" | "price-desc" | "size-desc";

export interface PropertyFilters {
  query: string;
  purpose: PurposeFilter;
  type: TypeFilter;
  bhk: BhkFilter;
  furnishing: FurnishingFilter;
  price: PriceFilter;
  sort: SortOption;
}

export const defaultFilters: PropertyFilters = {
  query: "",
  purpose: "all",
  type: "all",
  bhk: "all",
  furnishing: "all",
  price: "all",
  sort: "relevance",
};

const COMMERCIAL_TYPES = new Set(["Commercial Space", "Office Space", "Shop", "Industrial Plot"]);

export function countActiveFilters(f: PropertyFilters): number {
  let n = 0;
  if (f.purpose !== "all") n++;
  if (f.type !== "all") n++;
  if (f.bhk !== "all") n++;
  if (f.furnishing !== "all") n++;
  if (f.price !== "all") n++;
  return n;
}

export function isFiltering(f: PropertyFilters): boolean {
  return f.query.trim() !== "" || countActiveFilters(f) > 0;
}

function matchesPurpose(p: Property, purpose: PurposeFilter): boolean {
  switch (purpose) {
    case "buy":
      return p.purpose === "buy" || p.purpose === "sell";
    case "rent":
      return p.purpose === "rent" || p.purpose === "lease";
    case "commercial":
      return COMMERCIAL_TYPES.has(p.type);
    default:
      return true;
  }
}

function matchesPrice(p: Property, price: PriceFilter): boolean {
  switch (price) {
    case "under-50k":
      return p.price <= 50000;
    case "under-50L":
      return p.price <= 5000000;
    case "under-2Cr":
      return p.price <= 20000000;
    case "over-2Cr":
      return p.price > 20000000;
    default:
      return true;
  }
}

export function filterProperties(
  properties: Property[],
  city: string,
  filters: PropertyFilters,
): Property[] {
  const q = filters.query.trim().toLowerCase();

  const result = properties.filter((p) => {
    if (p.status !== "Active") return false;
    if (p.city.toLowerCase() !== city.toLowerCase()) return false;
    if (
      q !== "" &&
      !p.title.toLowerCase().includes(q) &&
      !p.locality.toLowerCase().includes(q) &&
      !p.type.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (filters.type !== "all" && p.type !== filters.type) return false;
    if (filters.bhk !== "all" && p.bhk !== filters.bhk) return false;
    if (filters.furnishing !== "all" && p.furnished !== filters.furnishing) return false;
    return matchesPurpose(p, filters.purpose) && matchesPrice(p, filters.price);
  });

  switch (filters.sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    case "size-desc":
      return result.sort((a, b) => b.size - a.size);
    default:
      return result;
  }
}
