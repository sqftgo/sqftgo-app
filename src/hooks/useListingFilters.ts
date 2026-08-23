import { useCallback, useEffect, useState } from "react";
import type { ListingFilter } from "@/data/listing-filters";
import { apiListListingFilters } from "@/lib/api/services/listing-filters";
import { isApiMode } from "@/lib/api/config";

export const FALLBACK_LISTING_FILTERS: ListingFilter[] = [
  { id: "purpose", key: "purpose", label: "Purpose", kind: "purpose", options: [], active: true, system: true, sortOrder: 10 },
  { id: "type", key: "type", label: "Property Type", kind: "type", options: [], active: true, system: true, sortOrder: 40 },
  { id: "bhk", key: "bhk", label: "BHK Size", kind: "bhk", options: [], active: true, system: true, sortOrder: 50 },
  { id: "price", key: "price", label: "Budget", kind: "price", options: [], active: true, system: true, sortOrder: 60 },
  { id: "size", key: "size", label: "Size", kind: "size", options: [], active: true, system: true, sortOrder: 70 },
  { id: "furnishing", key: "furnishing", label: "Furnishing", kind: "furnishing", options: [], active: true, system: true, sortOrder: 80 },
  { id: "amenities", key: "amenities", label: "Amenities", kind: "amenities", options: [], active: true, system: true, sortOrder: 90 },
  { id: "rera", key: "rera", label: "RERA Approved Only", kind: "rera", options: [], active: true, system: true, sortOrder: 100 },
  { id: "featured", key: "featured", label: "Featured Only", kind: "featured", options: [], active: true, system: true, sortOrder: 110 },
  { id: "locality", key: "locality", label: "Locality", kind: "locality", options: [], active: true, system: true, sortOrder: 30 },
];

export function isFilterOn(filters: ListingFilter[], key: string): boolean {
  const match = filters.find((f) => f.key === key);
  return match ? match.active : false;
}

export function useListingFilters() {
  const [filters, setFilters] = useState<ListingFilter[]>(FALLBACK_LISTING_FILTERS);

  const refresh = useCallback(async () => {
    if (!isApiMode) return;
    try {
      const rows = await apiListListingFilters();
      if (rows.length) setFilters(rows);
    } catch {
      setFilters(FALLBACK_LISTING_FILTERS);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    filters,
    isOn: (key: string) => isFilterOn(filters, key),
  };
}
