import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchX, SlidersHorizontal, X } from "@/components/ui/icons";

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
  type PropertyFilters,
  type PurposeFilter,
} from "@/lib/filters";
import { colors, radius, spacing, type } from "@/theme/tokens";

const PURPOSE_LABELS: Record<Exclude<PurposeFilter, "all">, string> = {
  buy: "Buy",
  rent: "Rent",
  commercial: "Commercial",
};

const SORT_LABELS: Record<PropertyFilters["sort"], string> = {
  relevance: "Relevance",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "size-desc": "Largest first",
};

/** One removable chip per active filter, shown under the search bar. */
function ActiveFilterChips({
  filters,
  onChange,
}: {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filters.purpose !== "all") {
    chips.push({
      key: "purpose",
      label: PURPOSE_LABELS[filters.purpose],
      clear: () => onChange({ ...filters, purpose: "all" }),
    });
  }
  if (filters.type !== "all") {
    chips.push({
      key: "type",
      label: filters.type === "Industrial Plot" ? "Plot" : filters.type,
      clear: () => onChange({ ...filters, type: "all" }),
    });
  }
  if (filters.bhk !== "all") {
    chips.push({
      key: "bhk",
      label: `${filters.bhk} BHK`,
      clear: () => onChange({ ...filters, bhk: "all" }),
    });
  }
  if (filters.price !== "all") {
    const labels = {
      "under-50k": "Under ₹50k/mo",
      "under-50L": "Under ₹50 L",
      "under-2Cr": "Under ₹2 Cr",
      "over-2Cr": "₹2 Cr+",
    } as const;
    chips.push({
      key: "price",
      label: labels[filters.price],
      clear: () => onChange({ ...filters, price: "all" }),
    });
  }
  if (filters.furnishing !== "all") {
    chips.push({
      key: "furnishing",
      label: filters.furnishing,
      clear: () => onChange({ ...filters, furnishing: "all" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={chip.clear}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${chip.label} filter`}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accentBorder,
            borderRadius: radius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs + 2,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ ...type.label, color: colors.accent }}>{chip.label}</Text>
          <X size={12} color={colors.accent} />
        </Pressable>
      ))}
      <Pressable
        onPress={() => onChange({ ...defaultFilters, query: filters.query, sort: filters.sort })}
        hitSlop={8}
        accessibilityRole="button"
      >
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
            onPress={() => setSheetVisible(true)}
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
                <Text style={{ ...type.micro, color: colors.onAccent }}>{activeCount}</Text>
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
          <Pressable onPress={() => setSheetVisible(true)} hitSlop={8} accessibilityRole="button">
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
              isFiltering(filters) ? () => setFilters(defaultFilters) : undefined
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
