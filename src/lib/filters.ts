import type { Furnishing, Property, PropertyType } from "@/data/types";

export type PurposeFilter = "all" | "buy" | "rent" | "commercial";
export type BhkFilter = number;
export type FurnishingFilter = Furnishing;
export type PriceFilter =
  | "all"
  // Rent intervals
  | "under-25k"
  | "25k-50k"
  | "50k-1L"
  | "over-1L"
  // Buy intervals
  | "under-50L"
  | "50L-1Cr"
  | "1Cr-2Cr"
  | "over-2Cr"
  // Fallbacks
  | "under-50k"
  | "under-2Cr";

export type TypeFilter = PropertyType | "all";
export type SortOption = "relevance" | "price-asc" | "price-desc" | "size-desc" | "featured";

export interface PropertyFilters {
  query: string;
  purpose: PurposeFilter;
  type: TypeFilter;
  bhk: number[]; // Multi-select array e.g. [1, 2, 3]
  furnishing: FurnishingFilter[]; // Multi-select array e.g. ["Furnished", "Semi-Furnished"]
  price: PriceFilter;
  reraApprovedOnly: boolean;
  featuredOnly: boolean;
  selectedAmenities: string[]; // Dynamic multi-select amenity tags
  sort: SortOption;
}

export const defaultFilters: PropertyFilters = {
  query: "",
  purpose: "all",
  type: "all",
  bhk: [],
  furnishing: [],
  price: "all",
  reraApprovedOnly: false,
  featuredOnly: false,
  selectedAmenities: [],
  sort: "relevance",
};

export const COMMERCIAL_TYPES = new Set<PropertyType>([
  "Commercial Space",
  "Office Space",
  "Shop",
  "Industrial Plot",
  "Hotel",
]);

export function countActiveFilters(f: PropertyFilters): number {
  let n = 0;
  if (f.purpose !== "all") n++;
  if (f.type !== "all") n++;
  if (f.bhk && f.bhk.length > 0) n += f.bhk.length;
  if (f.furnishing && f.furnishing.length > 0) n += f.furnishing.length;
  if (f.price !== "all") n++;
  if (f.reraApprovedOnly) n++;
  if (f.featuredOnly) n++;
  if (f.selectedAmenities && f.selectedAmenities.length > 0) n += f.selectedAmenities.length;
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
    case "under-25k":
      return p.price <= 25000;
    case "25k-50k":
      return p.price >= 25000 && p.price <= 50000;
    case "50k-1L":
      return p.price >= 50000 && p.price <= 100000;
    case "over-1L":
      return p.price > 100000;
    case "under-50k":
      return p.price <= 50000;
    case "under-50L":
      return p.price <= 5000000;
    case "50L-1Cr":
      return p.price >= 5000000 && p.price <= 10000000;
    case "1Cr-2Cr":
      return p.price >= 10000000 && p.price <= 20000000;
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
    if (city && p.city.toLowerCase() !== city.toLowerCase()) return false;
    if (
      q !== "" &&
      !p.title.toLowerCase().includes(q) &&
      !p.locality.toLowerCase().includes(q) &&
      !p.type.toLowerCase().includes(q) &&
      !p.description.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (filters.type !== "all" && p.type !== filters.type) return false;

    // Multi-select BHK
    if (filters.bhk && filters.bhk.length > 0) {
      if (p.bhk === undefined) return false;
      const matchesBhk = filters.bhk.some((val) => (val >= 5 ? p.bhk! >= 5 : p.bhk === val));
      if (!matchesBhk) return false;
    }

    // Multi-select Furnishing
    if (filters.furnishing && filters.furnishing.length > 0) {
      if (!filters.furnishing.includes(p.furnished)) return false;
    }

    // RERA Approved Only
    if (filters.reraApprovedOnly && !p.reraApproved) {
      return false;
    }

    // Featured Only
    if (filters.featuredOnly && !p.featured) {
      return false;
    }

    // Multi-select Amenities
    if (filters.selectedAmenities && filters.selectedAmenities.length > 0) {
      const propertyAmenities = p.amenities || [];
      const hasAll = filters.selectedAmenities.every((amenity) =>
        propertyAmenities.includes(amenity),
      );
      if (!hasAll) return false;
    }

    return matchesPurpose(p, filters.purpose) && matchesPrice(p, filters.price);
  });

  const sorted = [...result];
  switch (filters.sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "size-desc":
      return sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
    case "featured":
      return sorted.sort(
        (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.inquiryCount - a.inquiryCount,
      );
    case "relevance":
    default:
      return sorted.sort(
        (a, b) =>
          (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
          b.inquiryCount - a.inquiryCount ||
          a.title.localeCompare(b.title),
      );
  }
}
