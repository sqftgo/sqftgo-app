import { useQuery } from "@tanstack/react-query";

import { CITIES, type City } from "@/constants/cities";
import { isApiMode } from "@/lib/api/config";
import { apiListLocations, resolveLocationCoverUrl } from "@/lib/api/services/locations";

export interface CityOption extends City {
  id?: string;
  state?: string;
  propertyCount?: number;
}

const FALLBACK_IMAGE = CITIES[0]?.image ?? "";

function fallbackImageFor(name: string): string {
  return CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase())?.image ?? FALLBACK_IMAGE;
}

/** Active cities from the web catalog (`/api/locations`), bundled list offline or in mock mode. */
export function useCities(): {
  cities: CityOption[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const query = useQuery({
    queryKey: ["locations"],
    queryFn: apiListLocations,
    enabled: isApiMode,
    staleTime: 30 * 60_000,
  });

  const remote = query.data?.filter((l) => l.active);
  const cities: CityOption[] =
    remote && remote.length > 0
      ? remote
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder || a.city.localeCompare(b.city))
          .map((l) => ({
            id: l.id,
            name: l.city,
            state: l.state,
            propertyCount: l.propertyCount,
            image: resolveLocationCoverUrl(l.coverImageUrl) ?? fallbackImageFor(l.city),
          }))
      : CITIES;

  return {
    cities,
    isLoading: isApiMode && query.isLoading,
    isError: isApiMode && query.isError,
    error: query.error instanceof Error ? query.error : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
