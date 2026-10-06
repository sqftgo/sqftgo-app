import { useQuery } from "@tanstack/react-query";

import { FALLBACK_AMENITIES } from "@/components/listing/listing-draft";
import { isApiMode } from "@/lib/api/config";
import { apiListAmenities } from "@/lib/api/services/catalog";

/** Active amenity names from the web catalog, with the web's fallback list. */
export function useAmenities(): string[] {
  const query = useQuery({
    queryKey: ["amenities"],
    queryFn: apiListAmenities,
    enabled: isApiMode,
    staleTime: 30 * 60_000,
  });
  const names = query.data?.filter((a) => a.active !== false).map((a) => a.name) ?? [];
  return names.length > 0 ? names : FALLBACK_AMENITIES;
}
