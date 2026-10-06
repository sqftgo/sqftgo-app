import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useApp } from "@/context/AppContext";
import { isApiMode } from "@/lib/api/config";
import { isServiceDirectoryCategory } from "@/lib/is-dealer-category";
import { apiListServiceTypes, type ServiceType } from "@/lib/api/services/services";

/**
 * Active service categories from `/api/service-types`. Like the web, falls back to the
 * categories present on loaded service profiles when the catalog is empty.
 */
export function useServiceTypes(): { types: ServiceType[]; isLoading: boolean } {
  const { directoryProfiles } = useApp();
  const query = useQuery({
    queryKey: ["service-types"],
    queryFn: apiListServiceTypes,
    enabled: isApiMode,
    staleTime: 30 * 60_000,
  });

  const types = useMemo(() => {
    const remote = (query.data ?? []).filter((t) => t.active !== false);
    if (remote.length > 0) return remote;
    const names = new Set(
      directoryProfiles.filter((p) => isServiceDirectoryCategory(p.category)).map((p) => p.category),
    );
    return [...names].map((name) => ({ id: name, name, active: true }));
  }, [query.data, directoryProfiles]);

  return { types, isLoading: isApiMode && query.isLoading };
}
