import { useQuery } from "@tanstack/react-query";

import { CITIES, type City } from "@/constants/cities";
import { isApiMode } from "@/lib/api/config";
import { apiListLocations } from "@/lib/api/services/locations";

export interface CityOption extends City {
  state?: string;
  propertyCount?: number;
}

const FALLBACK_IMAGE = CITIES[0]?.image ?? "";

function imageFor(name: string): string {
  return CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase())?.image ?? FALLBACK_IMAGE;
}

/** Active cities from the web catalog (`/api/locations`), bundled list offline or in mock mode. */
export function useCities(): { cities: CityOption[]; isLoading: boolean } {
  const query = useQuery({
    queryKey: ["locations"],
    queryFn: apiListLocations,
    enabled: isApiMode,
    staleTime: 30 * 60_000,
  });

  const remote = query.data?.filter((l) => l.active);
  const cities: CityOption[] =
    remote && remote.length > 0
      ? remote.map((l) => ({ name: l.city, state: l.state, propertyCount: l.propertyCount, image: imageFor(l.city) }))
      : CITIES;

  return { cities, isLoading: isApiMode && query.isLoading };
}
