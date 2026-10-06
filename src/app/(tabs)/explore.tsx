import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
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
  isFiltering,
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
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "size-desc": "Largest first",
};

const QUICK_PURPOSES: PurposeFilter[] = ["buy", "rent"];

/** One-tap purpose and BHK toggles; everything else lives in the filter sheet. */
function QuickFilters({
  filters,
  onChange,
}: {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
}) {
  const tap = (next: PropertyFilters) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    onChange(next);
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
      style={{ marginHorizontal: -spacing.lg }}
    >
      {QUICK_PURPOSES.map((p) => (
        <Chip
          key={p}
          label={PURPOSE_LABELS[p as Exclude<PurposeFilter, "all">]}
          selected={filters.purpose === p}
          onPress={() => tap({ ...filters, purpose: filters.purpose === p ? "all" : p })}
        />
      ))}
      {BHK_OPTIONS.map((b) => {
        const on = filters.bhk.includes(b);
        return (
          <Chip
            key={b}
            label={`${b} BHK`}
            selected={on}
            showCheck
            onPress={() => tap({ ...filters, bhk: on ? filters.bhk.filter((x) => x !== b) : [...filters.bhk, b] })}
          />
        );
      })}
    </ScrollView>
  );
}

/** Removable chips for active filters, shown under the search bar. */
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

  if (filters.purpose !== "all" && !QUICK_PURPOSES.includes(filters.purpose)) {
    chips.push({
      key: `purpose-${filters.purpose}`,
      label: PURPOSE_LABELS[filters.purpose],
      clear: () => onChange({ ...filters, purpose: "all" }),
    });
  }

  if (filters.type !== "any") {
    chips.push({
      key: `type-${filters.type}`,
      label: filters.type === "commercial" ? "Commercial" : filters.type,
      clear: () => onChange({ ...filters, type: "any" }),
    });
  }

  if (filters.bhk.length > 0) {
    filters.bhk.filter((b) => !(BHK_OPTIONS as readonly string[]).includes(b)).forEach((b) => {
      chips.push({
        key: `bhk-${b}`,
        label: `${b} BHK`,
        clear: () => onChange({ ...filters, bhk: filters.bhk.filter((x) => x !== b) }),
      });
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
      label: "RERA Approved",
      clear: () => onChange({ ...filters, reraApprovedOnly: false }),
    });
  }

  if (filters.featuredOnly) {
    chips.push({
      key: "featured",
      label: "Featured Only",
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
  return <ChipRow chips={chips} filters={filters} onChange={onChange} />;
}

function ChipRow({
  chips,
  filters,
  onChange,
}: {
  chips: { key: string; label: string; clear: () => void }[];
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
}) {
  const handleResetAll = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    onChange({ ...defaultFilters, query: filters.query, sort: filters.sort });
  };

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
      {chips.map((chip) => (
        <RemovableFilterChip key={chip.key} label={chip.label} onRemove={chip.clear} />
      ))}
      <Pressable onPress={handleResetAll} hitSlop={8} accessibilityRole="button">
        <Text style={{ ...type.label, color: colors.inkMuted }}>Reset filters</Text>
      </Pressable>
    </View>
  );
}

export default function ExploreScreen() {
  const { properties, selectedCity, isApiMode } = useApp();
  const { filters: listingFilters } = useListingFilters();
  const params = useLocalSearchParams<{ purpose?: string; type?: string }>();

  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Home shortcuts: Buy / Rent / Commercial / Property Categories (Apartments, Villas, Commercial, Plots, etc.)
  useEffect(() => {
    const purpose = params.purpose;
    const type = params.type;

    if (type) {
      setFilters((prev) => ({
        ...prev,
        type,
        purpose: (purpose === "buy" || purpose === "sell" || purpose === "rent" || purpose === "lease") ? purpose : "all",
      }));
    } else if (purpose === "buy" || purpose === "sell" || purpose === "rent" || purpose === "lease") {
      setFilters((prev) => ({ ...prev, purpose, type: "any" }));
    } else if (purpose === "commercial") {
      setFilters((prev) => ({ ...prev, purpose: "all", type: "commercial" }));
    } else if (purpose === "plot") {
      setFilters((prev) => ({ ...prev, purpose: "all", type: "Industrial Plot" }));
    }
  }, [params.purpose, params.type]);

  const search = usePropertySearch(filters, listingFilters);
  const { results } = search;

  const countResults = useCallback(
    (draft: PropertyFilters) =>
      isApiMode ? null : filterProperties(properties, selectedCity, draft, listingFilters).length,
    [isApiMode, properties, selectedCity, listingFilters],
  );

  const activeCount = countActiveFilters(filters);

  const openFilters = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setSheetVisible(true);
  };

  const openCityPicker = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setCityModalVisible(true);
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
            <RefreshControl refreshing={search.isRefreshing} onRefresh={search.refresh} tintColor={colors.accent} />
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
              resultCount={
                search.isError ? null : search.isLoading ? undefined : search.hasMore ? search.total : results.length
              }
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
            <ErrorState message="Check your connection and try again." onRetry={search.refresh} />
          ) : search.hasMore ? (
            <ActivityIndicator color={colors.accent} style={{ paddingVertical: spacing.xl }} />
          ) : (
          <EmptyState
            icon={SearchX}
            title="No properties found"
            message={
              isFiltering(filters)
                ? `Nothing in ${selectedCity} matches your filters. Try widening your search.`
                : `There are no active listings in ${selectedCity} yet.`
            }
            actionLabel={isFiltering(filters) ? "Reset filters" : undefined}
            onAction={
              isFiltering(filters)
                ? () => {
                    if (process.env.EXPO_OS === "ios") {
                      Haptics.selectionAsync();
                    }
                    setFilters(defaultFilters);
                  }
                : undefined
            }
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

      <CitySelectionModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
      />
    </SafeAreaView>
  );
}
