import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SearchX } from "@/components/ui/icons";

import { Chip } from "@/components/ds/Chip";
import { ErrorState } from "@/components/ds/ErrorState";
import { PropertyCardSkeleton } from "@/components/ds/Skeleton";
import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { usePropertySearch } from "@/hooks/use-property-search";
import { RemovableFilterChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ExploreNavbar } from "@/components/ui/explore-navbar";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import {
  BHK_OPTIONS,
  countActiveFilters,
  defaultFilters,
  filterProperties,
  formatBudgetLabel,
  formatSizeLabel,
  hasClientOnlyFilters,
  isFiltering,
  NON_RESIDENTIAL_TYPES,
  type PropertyFilters,
  type PurposeFilter,
} from "@/lib/filters";
import { useListingFilters } from "@/hooks/useListingFilters";
import { colors, spacing, type } from "@/theme/tokens";

const PURPOSE_LABELS: Record<Exclude<PurposeFilter, "all">, string> = {
  buy: "Buy",
  sell: "Sell",
  rent: "Rent",
  lease: "Lease",
};

const SORT_LABELS: Record<PropertyFilters["sort"], string> = {
  latest: "Latest",
  "price-asc": "Price ↑",
  "price-desc": "Price ↓",
  "size-desc": "Largest",
};

type QuickIntent = "all" | "buy" | "rent" | "plot";

const QUICK_INTENTS: { id: QuickIntent; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "plot", label: "Plots" },
];

function intentFromFilters(filters: PropertyFilters): QuickIntent {
  if (filters.type === "Industrial Plot") return "plot";
  if (filters.purpose === "buy" || filters.purpose === "sell") return "buy";
  if (filters.purpose === "rent" || filters.purpose === "lease") return "rent";
  return "all";
}

function applyQuickIntent(filters: PropertyFilters, intent: QuickIntent): PropertyFilters {
  switch (intent) {
    case "buy":
      return { ...filters, purpose: "buy", type: "any" };
    case "rent":
      return { ...filters, purpose: "rent", type: "any" };
    case "plot":
      return { ...filters, purpose: "all", type: "Industrial Plot", bhk: [] };
    default:
      return { ...filters, purpose: "all", type: "any" };
  }
}

/** One-tap browse intents aligned with Home (All / Buy / Rent / Plots). */
function QuickFilters({
  filters,
  onChange,
}: {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
}) {
  const activeIntent = intentFromFilters(filters);
  const showBhk = !NON_RESIDENTIAL_TYPES.has(filters.type);

  const tap = (next: PropertyFilters) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ ...type.label, color: colors.inkSecondary, paddingHorizontal: 2 }}>
        Looking to
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        style={{ marginHorizontal: -spacing.lg }}
      >
        {QUICK_INTENTS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={activeIntent === item.id}
            onPress={() => tap(applyQuickIntent(filters, item.id))}
          />
        ))}
        {showBhk
          ? BHK_OPTIONS.map((b) => {
              const on = filters.bhk.includes(b);
              return (
                <Chip
                  key={b}
                  label={`${b} BHK`}
                  selected={on}
                  showCheck
                  onPress={() =>
                    tap({
                      ...filters,
                      bhk: on ? filters.bhk.filter((x) => x !== b) : [...filters.bhk, b],
                    })
                  }
                />
              );
            })
          : null}
      </ScrollView>
    </View>
  );
}

/** Removable chips for sheet-only filters (quick intents stay in the row above). */
function ActiveFilterChips({
  filters,
  onChange,
}: {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filters.locality.trim()) {
    chips.push({
      key: "locality",
      label: filters.locality.trim(),
      clear: () => onChange({ ...filters, locality: "" }),
    });
  }

  if (filters.purpose === "sell" || filters.purpose === "lease") {
    chips.push({
      key: `purpose-${filters.purpose}`,
      label: PURPOSE_LABELS[filters.purpose],
      clear: () => onChange({ ...filters, purpose: "all" }),
    });
  }

  if (filters.type !== "any" && filters.type !== "Industrial Plot") {
    chips.push({
      key: `type-${filters.type}`,
      label: filters.type === "commercial" ? "Commercial" : filters.type,
      clear: () => onChange({ ...filters, type: "any" }),
    });
  }

  if (filters.minPrice) {
    chips.push({
      key: "minPrice",
      label: `Min ${formatBudgetLabel(filters.minPrice, filters.purpose)}`,
      clear: () => onChange({ ...filters, minPrice: "" }),
    });
  }
  if (filters.maxPrice) {
    chips.push({
      key: "maxPrice",
      label: `Max ${formatBudgetLabel(filters.maxPrice, filters.purpose)}`,
      clear: () => onChange({ ...filters, maxPrice: "" }),
    });
  }

  if (filters.minSize) {
    chips.push({
      key: "minSize",
      label: `Min ${formatSizeLabel(filters.minSize)}`,
      clear: () => onChange({ ...filters, minSize: "" }),
    });
  }
  if (filters.maxSize) {
    chips.push({
      key: "maxSize",
      label: `Max ${formatSizeLabel(filters.maxSize)}`,
      clear: () => onChange({ ...filters, maxSize: "" }),
    });
  }

  if (filters.furnishing.length > 0) {
    filters.furnishing.forEach((f) => {
      chips.push({
        key: `furnishing-${f}`,
        label: f,
        clear: () =>
          onChange({ ...filters, furnishing: filters.furnishing.filter((x) => x !== f) }),
      });
    });
  }

  if (filters.reraApprovedOnly) {
    chips.push({
      key: "rera",
      label: "RERA approved",
      clear: () => onChange({ ...filters, reraApprovedOnly: false }),
    });
  }

  if (filters.featuredOnly) {
    chips.push({
      key: "featured",
      label: "Featured",
      clear: () => onChange({ ...filters, featuredOnly: false }),
    });
  }

  if (filters.selectedAmenities.length > 0) {
    filters.selectedAmenities.forEach((a) => {
      chips.push({
        key: `amenity-${a}`,
        label: a,
        clear: () =>
          onChange({
            ...filters,
            selectedAmenities: filters.selectedAmenities.filter((x) => x !== a),
          }),
      });
    });
  }

  if (chips.length === 0) return null;

  const handleResetAll = () => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    onChange({ ...defaultFilters, query: filters.query, sort: filters.sort });
  };

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
      {chips.map((chip) => (
        <RemovableFilterChip key={chip.key} label={chip.label} onRemove={chip.clear} />
      ))}
      <Pressable onPress={handleResetAll} hitSlop={8} accessibilityRole="button">
        <Text style={{ ...type.label, color: colors.inkMuted }}>Clear all</Text>
      </Pressable>
    </View>
  );
}

export default function ExploreScreen() {
  const { properties, selectedCity, setSelectedCity, isApiMode } = useApp();
  const { filters: listingFilters } = useListingFilters();
  const params = useLocalSearchParams<{
    purpose?: string;
    type?: string;
    city?: string;
    locality?: string;
  }>();

  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Home / Destinations → Explore handoff
  useEffect(() => {
    const purpose = params.purpose;
    const type = params.type;
    const city = typeof params.city === "string" ? params.city.trim() : "";
    const locality = typeof params.locality === "string" ? params.locality.trim() : "";

    if (city) setSelectedCity(city);

    setFilters((prev) => {
      let next: PropertyFilters = { ...prev };
      if (type) {
        next = {
          ...next,
          type,
          purpose:
            purpose === "buy" || purpose === "sell" || purpose === "rent" || purpose === "lease"
              ? purpose
              : "all",
          bhk: NON_RESIDENTIAL_TYPES.has(type) ? [] : next.bhk,
        };
      } else if (purpose === "buy" || purpose === "sell" || purpose === "rent" || purpose === "lease") {
        next = { ...next, purpose, type: "any" };
      } else if (purpose === "commercial") {
        next = { ...next, purpose: "all", type: "commercial", bhk: [] };
      } else if (purpose === "plot") {
        next = { ...next, purpose: "all", type: "Industrial Plot", bhk: [] };
      }
      // Destination / deep-link handoff: city alone clears locality; locality sets search area.
      if (city || locality) {
        next = { ...next, locality, query: locality ? "" : next.query };
      }
      return next;
    });
  }, [params.purpose, params.type, params.city, params.locality, setSelectedCity]);

  const search = usePropertySearch(filters, listingFilters);
  const { results } = search;

  const countResults = useCallback(
    (draft: PropertyFilters) =>
      isApiMode ? null : filterProperties(properties, selectedCity, draft, listingFilters).length,
    [isApiMode, properties, selectedCity, listingFilters],
  );

  const activeCount = countActiveFilters(filters);
  const clientOnly = useMemo(() => hasClientOnlyFilters(filters), [filters]);

  const resultCount = useMemo(() => {
    if (search.isError) return null;
    if (search.isLoading) return undefined;
    // When client refinements apply, server total would overstate matches.
    if (clientOnly) return results.length;
    if (typeof search.total === "number") return search.total;
    return results.length;
  }, [search.isError, search.isLoading, search.total, clientOnly, results.length]);

  const openFilters = () => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setSheetVisible(true);
  };

  const openCityPicker = () => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setCityModalVisible(true);
  };

  const resetFilters = () => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setFilters(defaultFilters);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        onEndReached={search.loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          isApiMode ? (
            <RefreshControl
              refreshing={search.isRefreshing}
              onRefresh={search.refresh}
              tintColor={colors.accent}
            />
          ) : undefined
        }
        ListFooterComponent={
          search.isFetchingMore ? (
            <ActivityIndicator color={colors.accent} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["3xl"],
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <ExploreNavbar
              city={selectedCity}
              query={filters.query}
              onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
              onPressCity={openCityPicker}
              onPressFilters={openFilters}
              activeFilterCount={activeCount}
              resultCount={resultCount}
              hasMore={!clientOnly && search.hasMore}
              sortLabel={SORT_LABELS[filters.sort]}
            />
            <QuickFilters filters={filters} onChange={setFilters} />
            {activeCount > 0 ? (
              <ActiveFilterChips filters={filters} onChange={setFilters} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          search.isLoading ? (
            <View style={{ gap: spacing.md }}>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </View>
          ) : search.isError ? (
            <ErrorState
              title="Couldn't load listings"
              message="Check your connection and try again."
              onRetry={search.refresh}
            />
          ) : search.hasMore && results.length === 0 ? (
            <ActivityIndicator color={colors.accent} style={{ paddingVertical: spacing.xl }} />
          ) : (
            <EmptyState
              icon={SearchX}
              title={isFiltering(filters) ? "No matches" : `No listings in ${selectedCity}`}
              message={
                isFiltering(filters)
                  ? `Nothing in ${selectedCity} matches these filters. Clear a filter or try another city.`
                  : `There are no active listings in ${selectedCity} yet. Try another city from the header.`
              }
              actionLabel={isFiltering(filters) ? "Clear filters" : "Change city"}
              onAction={isFiltering(filters) ? resetFilters : openCityPicker}
            />
          )
        }
      />

      <FilterSheet
        visible={sheetVisible}
        filters={filters}
        countResults={countResults}
        onApply={setFilters}
        onClose={() => setSheetVisible(false)}
        listingFilters={listingFilters}
      />

      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
    </SafeAreaView>
  );
}
