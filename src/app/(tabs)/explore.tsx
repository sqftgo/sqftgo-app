import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SearchX } from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { RemovableFilterChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ExploreNavbar } from "@/components/ui/explore-navbar";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import {
  countActiveFilters,
  defaultFilters,
  filterProperties,
  formatBudgetLabel,
  formatSizeLabel,
  isFiltering,
  type PropertyFilters,
  type PurposeFilter,
} from "@/lib/filters";
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

  if (filters.purpose !== "all") {
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
    filters.bhk.forEach((b) => {
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
  const { properties, selectedCity } = useApp();
  const params = useLocalSearchParams<{ purpose?: string }>();

  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Home shortcuts: Buy / Rent / Commercial (Commercial → type group, like listings commercial types).
  useEffect(() => {
    const purpose = params.purpose;
    if (purpose === "buy" || purpose === "sell" || purpose === "rent" || purpose === "lease") {
      setFilters((prev) => ({ ...prev, purpose, type: "any" }));
    } else if (purpose === "commercial") {
      setFilters((prev) => ({ ...prev, purpose: "all", type: "commercial" }));
    }
  }, [params.purpose]);

  const results = useMemo(
    () => filterProperties(properties, selectedCity, filters),
    [properties, selectedCity, filters],
  );

  const countResults = useCallback(
    (draft: PropertyFilters) => filterProperties(properties, selectedCity, draft).length,
    [properties, selectedCity],
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
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
              resultCount={results.length}
              sortLabel={SORT_LABELS[filters.sort]}
            />
            {activeCount > 0 ? (
              <ActiveFilterChips filters={filters} onChange={setFilters} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
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
        }
      />

      <FilterSheet
        visible={sheetVisible}
        filters={filters}
        countResults={countResults}
        onApply={setFilters}
        onClose={() => setSheetVisible(false)}
      />

      <CitySelectionModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
      />
    </SafeAreaView>
  );
}
