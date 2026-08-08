import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SearchX, SlidersHorizontal } from "@/components/ui/icons";

import { RemovableFilterChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { PropertyCard } from "@/components/ui/property-card";
import { SearchBar } from "@/components/ui/search-bar";
import { useApp } from "@/context/AppContext";
import {
  countActiveFilters,
  defaultFilters,
  filterProperties,
  isFiltering,
  type PriceFilter,
  type PropertyFilters,
  type PurposeFilter,
} from "@/lib/filters";
import { colors, radius, spacing, type } from "@/theme/tokens";

const PURPOSE_LABELS: Record<Exclude<PurposeFilter, "all">, string> = {
  buy: "Buy",
  rent: "Rent",
  commercial: "Commercial",
};

const PRICE_LABELS: Record<Exclude<PriceFilter, "all">, string> = {
  "under-25k": "Under ₹25k/mo",
  "25k-50k": "₹25k - ₹50k/mo",
  "50k-1L": "₹50k - ₹1L/mo",
  "over-1L": "₹1L+/mo",
  "under-50L": "Under ₹50 L",
  "50L-1Cr": "₹50 L - ₹1 Cr",
  "1Cr-2Cr": "₹1 Cr - ₹2 Cr",
  "over-2Cr": "₹2 Cr+",
  "under-50k": "Under ₹50k/mo",
  "under-2Cr": "Under ₹2 Cr",
};

const SORT_LABELS: Record<PropertyFilters["sort"], string> = {
  relevance: "Relevance",
  featured: "Featured first",
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

  // Purpose
  if (filters.purpose !== "all") {
    chips.push({
      key: `purpose-${filters.purpose}`,
      label: PURPOSE_LABELS[filters.purpose],
      clear: () => onChange({ ...filters, purpose: "all" }),
    });
  }

  // Type
  if (filters.type !== "all") {
    chips.push({
      key: `type-${filters.type}`,
      label: filters.type === "Industrial Plot" ? "Plot" : filters.type,
      clear: () => onChange({ ...filters, type: "all" }),
    });
  }

  // Multi-select BHK
  if (filters.bhk && filters.bhk.length > 0) {
    filters.bhk.forEach((b) => {
      chips.push({
        key: `bhk-${b}`,
        label: `${b >= 5 ? "5+" : b} BHK`,
        clear: () => onChange({ ...filters, bhk: filters.bhk.filter((x) => x !== b) }),
      });
    });
  }

  // Budget
  if (filters.price !== "all") {
    chips.push({
      key: `price-${filters.price}`,
      label: PRICE_LABELS[filters.price] || filters.price,
      clear: () => onChange({ ...filters, price: "all" }),
    });
  }

  // Multi-select Furnishing
  if (filters.furnishing && filters.furnishing.length > 0) {
    filters.furnishing.forEach((f) => {
      chips.push({
        key: `furnishing-${f}`,
        label: f,
        clear: () =>
          onChange({ ...filters, furnishing: filters.furnishing.filter((x) => x !== f) }),
      });
    });
  }

  // RERA Verified
  if (filters.reraApprovedOnly) {
    chips.push({
      key: "rera",
      label: "RERA Verified",
      clear: () => onChange({ ...filters, reraApprovedOnly: false }),
    });
  }

  // Featured
  if (filters.featuredOnly) {
    chips.push({
      key: "featured",
      label: "Featured Only",
      clear: () => onChange({ ...filters, featuredOnly: false }),
    });
  }

  // Multi-select Amenities
  if (filters.selectedAmenities && filters.selectedAmenities.length > 0) {
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

  // Apply the intent shortcut from Home ("Buy", "Rent", "Commercial").
  useEffect(() => {
    if (params.purpose === "buy" || params.purpose === "rent" || params.purpose === "commercial") {
      setFilters((prev) => ({ ...prev, purpose: params.purpose as PurposeFilter }));
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

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
        <Text style={{ ...type.title, color: colors.ink }}>Explore {selectedCity}</Text>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={filters.query}
              onChangeText={(query) => setFilters((prev) => ({ ...prev, query }))}
              placeholder="Locality, project, or type"
            />
          </View>
          <Pressable
            onPress={openFilters}
            accessibilityRole="button"
            accessibilityLabel={
              activeCount > 0 ? `Filters, ${activeCount} active` : "Open filters"
            }
            style={({ pressed }) => ({
              width: 46,
              height: 46,
              borderRadius: radius.md,
              borderCurve: "continuous",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: activeCount > 0 ? colors.ink : colors.surface,
              borderWidth: 1,
              borderColor: activeCount > 0 ? colors.ink : colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <SlidersHorizontal
              size={18}
              color={activeCount > 0 ? colors.surface : colors.ink}
            />
            {activeCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  minWidth: 18,
                  height: 18,
                  borderRadius: radius.full,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ ...type.micro, color: colors.onAccent, fontWeight: "700" }}>
                  {activeCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <ActiveFilterChips filters={filters} onChange={setFilters} />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ ...type.caption, color: colors.inkMuted }}>
            {results.length === 1 ? "1 property" : `${results.length} properties`}
          </Text>
          <Pressable onPress={openFilters} hitSlop={8} accessibilityRole="button">
            <Text style={{ ...type.caption, color: colors.inkSecondary }}>
              Sorted by {SORT_LABELS[filters.sort]}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
        }}
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
    </SafeAreaView>
  );
}

