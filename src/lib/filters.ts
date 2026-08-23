import type { Furnishing, Property, PropertyType } from "@/data/types";
import type { ListingFilter } from "@/data/listing-filters";

export type PurposeFilter = "all" | "buy" | "sell" | "rent" | "lease";
export type FurnishingFilter = Furnishing;
export type SortOption = "latest" | "price-asc" | "price-desc" | "size-desc";
export interface PropertyFilters {

  query: string;
  locality: string;
  purpose: PurposeFilter;
  type: string;
  bhk: string[];
  furnishing: FurnishingFilter[];
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  reraApprovedOnly: boolean;
  featuredOnly: boolean;
  selectedAmenities: string[];
  extra: Record<string, string | string[] | boolean>;
  sort: SortOption;
}

export const defaultFilters: PropertyFilters = {
  query: "",
  locality: "",
  purpose: "all",
  type: "any",
  bhk: [],
  furnishing: [],
  minPrice: "",
  maxPrice: "",
  minSize: "",
  maxSize: "",
  reraApprovedOnly: false,
  featuredOnly: false,
  selectedAmenities: [],
  extra: {},
  sort: "latest",
};

/** Same catalog as web `PROPERTY_TYPES`. */
export const PROPERTY_TYPE_OPTIONS: PropertyType[] = [
  "Home",
  "Villa",
  "Hotel",
  "Agricultural Land",
  "Apartment",
  "Office Space",
  "Commercial Space",
  "Shop",
  "Industrial Plot",
];

export const BHK_OPTIONS = ["1", "2", "3"] as const;

export const FURNISHING_OPTIONS: FurnishingFilter[] = [
  "Furnished",
  "Semi-Furnished",
  "Unfurnished",
];

/** Same fallback amenities as web listings. */
export const AMENITY_OPTIONS = [
  "Swimming Pool",
  "Gym",
  "Garden",
  "Parking",
  "EV Charging",
  "Power Backup",
  "Security",
] as const;

export const COMMERCIAL_TYPES = new Set<PropertyType>([
  "Commercial Space",
  "Office Space",
  "Shop",
  "Industrial Plot",
  "Hotel",
]);

/** Types that hide BHK / furnishing on web. */
export const NON_RESIDENTIAL_TYPES = new Set<string>([
  "Industrial Plot",
  "Agricultural Land",
  "Commercial Space",
  "Office Space",
  "Shop",
  "Hotel",
  "commercial",
]);

export const BUDGET_BUY_MIN_OPTIONS = [
  { label: "Min Price", value: "" },
  { label: "₹10 Lakhs", value: "1000000" },
  { label: "₹20 Lakhs", value: "2000000" },
  { label: "₹30 Lakhs", value: "3000000" },
  { label: "₹40 Lakhs", value: "4000000" },
  { label: "₹50 Lakhs", value: "5000000" },
  { label: "₹75 Lakhs", value: "7500000" },
  { label: "₹1 Crore", value: "10000000" },
  { label: "₹1.5 Crores", value: "15000000" },
  { label: "₹2 Crores", value: "20000000" },
  { label: "₹3 Crores", value: "30000000" },
  { label: "₹5 Crores", value: "50000000" },
  { label: "₹10 Crores", value: "100000000" },
];

export const BUDGET_BUY_MAX_OPTIONS = [
  { label: "Max Price", value: "" },
  { label: "₹20 Lakhs", value: "2000000" },
  { label: "₹30 Lakhs", value: "3000000" },
  { label: "₹40 Lakhs", value: "4000000" },
  { label: "₹50 Lakhs", value: "5000000" },
  { label: "₹75 Lakhs", value: "7500000" },
  { label: "₹1 Crore", value: "10000000" },
  { label: "₹1.5 Crores", value: "15000000" },
  { label: "₹2 Crores", value: "20000000" },
  { label: "₹3 Crores", value: "30000000" },
  { label: "₹5 Crores", value: "50000000" },
  { label: "₹10 Crores", value: "100000000" },
  { label: "₹15 Crores", value: "150000000" },
];

export const BUDGET_RENT_MIN_OPTIONS = [
  { label: "Min Rent", value: "" },
  { label: "₹5,000", value: "5000" },
  { label: "₹7,500", value: "7500" },
  { label: "₹10,000", value: "10000" },
  { label: "₹12,500", value: "12500" },
  { label: "₹15,000", value: "15000" },
  { label: "₹20,000", value: "20000" },
  { label: "₹25,000", value: "25000" },
  { label: "₹30,000", value: "30000" },
  { label: "₹40,000", value: "40000" },
  { label: "₹50,000", value: "50000" },
  { label: "₹75,000", value: "75000" },
  { label: "₹1 Lakh", value: "100000" },
  { label: "₹2 Lakhs", value: "200000" },
];

export const BUDGET_RENT_MAX_OPTIONS = [
  { label: "Max Rent", value: "" },
  { label: "₹7,500", value: "7500" },
  { label: "₹10,000", value: "10000" },
  { label: "₹12,500", value: "12500" },
  { label: "₹15,000", value: "15000" },
  { label: "₹20,000", value: "20000" },
  { label: "₹25,000", value: "25000" },
  { label: "₹30,000", value: "30000" },
  { label: "₹40,000", value: "40000" },
  { label: "₹50,000", value: "50000" },
  { label: "₹75,000", value: "75000" },
  { label: "₹1 Lakh", value: "100000" },
  { label: "₹1.5 Lakhs", value: "150000" },
  { label: "₹2 Lakhs", value: "200000" },
];

export const SIZE_MIN_OPTIONS = [
  { label: "Min Size", value: "" },
  { label: "500 sq.ft.", value: "500" },
  { label: "750 sq.ft.", value: "750" },
  { label: "1,000 sq.ft.", value: "1000" },
  { label: "1,250 sq.ft.", value: "1250" },
  { label: "1,500 sq.ft.", value: "1500" },
  { label: "2,000 sq.ft.", value: "2000" },
  { label: "2,500 sq.ft.", value: "2500" },
  { label: "3,000 sq.ft.", value: "3000" },
  { label: "5,000 sq.ft.", value: "5000" },
];

export const SIZE_MAX_OPTIONS = [
  { label: "Max Size", value: "" },
  { label: "750 sq.ft.", value: "750" },
  { label: "1,000 sq.ft.", value: "1000" },
  { label: "1,250 sq.ft.", value: "1250" },
  { label: "1,500 sq.ft.", value: "1500" },
  { label: "2,000 sq.ft.", value: "2000" },
  { label: "2,500 sq.ft.", value: "2500" },
  { label: "3,000 sq.ft.", value: "3000" },
  { label: "5,000 sq.ft.", value: "5000" },
  { label: "10,000 sq.ft.", value: "10000" },
];

export function isRentLikePurpose(purpose: PurposeFilter): boolean {
  return purpose === "rent" || purpose === "lease";
}

export function formatBudgetLabel(value: string, purpose: PurposeFilter): string {
  if (!value) return "";
  const opts = isRentLikePurpose(purpose)
    ? [...BUDGET_RENT_MIN_OPTIONS, ...BUDGET_RENT_MAX_OPTIONS]
    : [...BUDGET_BUY_MIN_OPTIONS, ...BUDGET_BUY_MAX_OPTIONS];
  return opts.find((o) => o.value === value)?.label ?? value;
}

export function formatSizeLabel(value: string): string {
  if (!value) return "";
  return (
    [...SIZE_MIN_OPTIONS, ...SIZE_MAX_OPTIONS].find((o) => o.value === value)?.label ??
    `${value} sq.ft.`
  );
}

export function countActiveFilters(f: PropertyFilters): number {
  let n = 0;
  if (f.locality.trim()) n++;
  if (f.purpose !== "all") n++;
  if (f.type !== "any") n++;
  if (f.bhk.length > 0) n += f.bhk.length;
  if (f.furnishing.length > 0) n += f.furnishing.length;
  if (f.minPrice) n++;
  if (f.maxPrice) n++;
  if (f.minSize) n++;
  if (f.maxSize) n++;
  if (f.reraApprovedOnly) n++;
  if (f.featuredOnly) n++;
  if (f.selectedAmenities.length > 0) n += f.selectedAmenities.length;
  if (f.extra) {
    for (const val of Object.values(f.extra)) {
      if (val === true) n++;
      else if (typeof val === "string" && val.trim()) n++;
      else if (Array.isArray(val) && val.length) n += val.length;
    }
  }
  return n;
}

export function isFiltering(f: PropertyFilters): boolean {
  return f.query.trim() !== "" || countActiveFilters(f) > 0;
}

function matchesType(p: Property, type: string): boolean {
  if (!type || type === "any") return true;
  if (type === "commercial") return COMMERCIAL_TYPES.has(p.type);
  return p.type === type;
}

/** Client-side filter — same rules as web `listings/page.tsx` `filterProperties`. */
export function filterProperties(
  properties: Property[],
  city: string,
  filters: PropertyFilters,
  catalog?: ListingFilter[],
): Property[] {
  const q = filters.query.trim().toLowerCase();
  const locality = filters.locality.trim().toLowerCase();
  const enabled = (key: string) =>
    !catalog || catalog.length === 0 || catalog.some((f) => f.key === key && f.active);

  const result = properties.filter((p) => {
    if (p.status !== "Active") return false;

    // City (from app context / web filters.city)
    if (city && city.toLowerCase() !== "all india" && p.city.toLowerCase() !== city.toLowerCase()) {
      return false;
    }

    // Locality
    if (enabled("locality") && locality && !p.locality.toLowerCase().includes(locality)) return false;

    // Search query (mobile search bar — OR across fields)
    if (
      q !== "" &&
      !p.title.toLowerCase().includes(q) &&
      !p.locality.toLowerCase().includes(q) &&
      !p.type.toLowerCase().includes(q) &&
      !p.description.toLowerCase().includes(q)
    ) {
      return false;
    }

    // Purpose — exact match like web (not buy↔sell merge)
    if (enabled("purpose") && filters.purpose !== "all" && p.purpose !== filters.purpose) return false;

    // Type
    if (enabled("type") && !matchesType(p, filters.type)) return false;

    // BHK
    if (enabled("bhk") && filters.bhk.length > 0) {
      if (p.bhk == null) return false;
      if (!filters.bhk.includes(String(p.bhk))) return false;
    }

    // Furnishing
    if (enabled("furnishing") && filters.furnishing.length > 0 && !filters.furnishing.includes(p.furnished)) {
      return false;
    }

    // Min / max price
    if (enabled("price") && filters.minPrice) {
      const minVal = parseInt(filters.minPrice, 10);
      if (!Number.isNaN(minVal) && p.price < minVal) return false;
    }
    if (enabled("price") && filters.maxPrice) {
      const maxVal = parseInt(filters.maxPrice, 10);
      if (!Number.isNaN(maxVal) && p.price > maxVal) return false;
    }

    // RERA / featured
    if (enabled("rera") && filters.reraApprovedOnly && !p.reraApproved) return false;
    if (enabled("featured") && filters.featuredOnly && !p.featured) return false;

    // Size
    if (enabled("size") && filters.minSize) {
      const minS = parseInt(filters.minSize, 10);
      if (!Number.isNaN(minS) && (p.size ?? 0) < minS) return false;
    }
    if (enabled("size") && filters.maxSize) {
      const maxS = parseInt(filters.maxSize, 10);
      if (!Number.isNaN(maxS) && (p.size ?? 0) > maxS) return false;
    }

    // Amenities (AND) — web uses case-insensitive includes
    if (enabled("amenities") && filters.selectedAmenities.length > 0) {
      const propertyAmenities = p.amenities || [];
      const hasAll = filters.selectedAmenities.every((amenity) =>
        propertyAmenities.some((a) => a.toLowerCase().includes(amenity.toLowerCase())),
      );
      if (!hasAll) return false;
    }

    const extra = filters.extra ?? {};
    const customDefs = (catalog ?? []).filter(
      (f) => f.active && (f.kind === "text" || f.kind === "toggle" || f.kind === "multi"),
    );
    for (const def of customDefs) {
      const raw = extra[def.key];
      if (raw == null || raw === false || raw === "") continue;
      if (Array.isArray(raw) && raw.length === 0) continue;
      const rec = p as unknown as Record<string, unknown>;
      const fieldValue = def.propertyField ? rec[def.propertyField] : undefined;
      if (def.kind === "toggle") {
        if (!fieldValue) return false;
        continue;
      }
      const haystack = Array.isArray(fieldValue)
        ? fieldValue.map((v) => String(v).toLowerCase())
        : [String(fieldValue ?? "").toLowerCase()];
      const needles = Array.isArray(raw) ? raw.map(String) : [String(raw)];
      const ok = needles.some((n) => haystack.some((h) => h.includes(n.trim().toLowerCase())));
      if (!ok) return false;
    }

    return true;
  });

  const sorted = [...result];
  switch (filters.sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "size-desc":
      return sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
    case "latest":
    default:
      return sorted.sort((a, b) => b.id.localeCompare(a.id));
  }
}
