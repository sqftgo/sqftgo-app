import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useApp } from "@/context/AppContext";
import type { ListingFilter } from "@/data/listing-filters";
import type { Property } from "@/data/types";
import { apiListPropertiesPage, type PropertyListFilters } from "@/lib/api/services/properties";
import { filterProperties, type PropertyFilters } from "@/lib/filters";

const PAGE_SIZE = 20;

/** Filters the BFF applies (`/api/properties`); everything else is refined on loaded pages. */
export function toServerFilters(city: string, f: PropertyFilters): PropertyListFilters {
  const query = f.query.trim();
  const locality = f.locality.trim();
  const priceMin = f.minPrice ? Number(f.minPrice) : undefined;
  const priceMax = f.maxPrice ? Number(f.maxPrice) : undefined;
  return {
    status: "Active",
    city: city && city.toLowerCase() !== "all india" ? city : undefined,
    purpose: f.purpose !== "all" ? f.purpose : undefined,
    type: f.type !== "any" && f.type !== "commercial" ? f.type : undefined,
    minPrice: Number.isFinite(priceMin) ? priceMin : undefined,
    maxPrice: Number.isFinite(priceMax) ? priceMax : undefined,
    featured: f.featuredOnly || undefined,
    search: query || locality || undefined,
    limit: PAGE_SIZE,
  };
}

export function usePropertySearch(filters: PropertyFilters, catalog?: ListingFilter[]) {
  const { isApiMode, properties, selectedCity, mergeProperties } = useApp();
  const server = useMemo(() => toServerFilters(selectedCity, filters), [selectedCity, filters]);

  const query = useInfiniteQuery({
    queryKey: ["properties", "search", server],
    queryFn: ({ pageParam }) => apiListPropertiesPage({ ...server, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length;
      return last.items.length > 0 && next < last.total ? next : undefined;
    },
    enabled: isApiMode,
  });

  const loaded = useMemo<Property[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  useEffect(() => {
    if (loaded.length) mergeProperties(loaded);
  }, [loaded, mergeProperties]);

  const results = useMemo(() => {
    if (!isApiMode) return filterProperties(properties, selectedCity, filters, catalog);
    // Server already matched the search text across title / locality / city.
    const refine: PropertyFilters = {
      ...filters,
      query: "",
      locality: filters.query.trim() ? filters.locality : "",
    };
    return filterProperties(loaded, selectedCity, refine, catalog);
  }, [isApiMode, properties, loaded, selectedCity, filters, catalog]);

  const total = isApiMode ? query.data?.pages[0]?.total : results.length;

  // Local refinements (BHK, size, amenities) can empty a page; keep fetching until something shows.
  const { hasNextPage, isFetchingNextPage, isFetching, fetchNextPage } = query;
  useEffect(() => {
    if (isApiMode && results.length < 6 && hasNextPage && !isFetching && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [isApiMode, results.length, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  return {
    results,
    /** Server total before local refinement (bhk, size, amenities…); undefined while loading. */
    total,
    isLoading: isApiMode && query.isPending,
    isError: isApiMode && query.isError,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    refresh: () => void query.refetch(),
  };
}
