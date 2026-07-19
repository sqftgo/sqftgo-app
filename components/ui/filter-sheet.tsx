import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";

import { FilterOptionRow } from "@/components/ui/chip";
import {
  countActiveFilters,
  defaultFilters,
  type BhkFilter,
  type FurnishingFilter,
  type PriceFilter,
  type PropertyFilters,
  type PurposeFilter,
  type SortOption,
  type TypeFilter,
} from "@/lib/filters";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const PURPOSE_OPTIONS: { value: PurposeFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "commercial", label: "Commercial" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "Apartment", label: "Apartment" },
  { value: "Home", label: "House" },
  { value: "Villa", label: "Villa" },
  { value: "Industrial Plot", label: "Plot" },
];

const BHK_OPTIONS: { value: BhkFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: 1, label: "1 BHK" },
  { value: 2, label: "2 BHK" },
  { value: 3, label: "3 BHK" },
  { value: 4, label: "4 BHK" },
  { value: 5, label: "5+ BHK" },
];

const FURNISHING_OPTIONS: { value: FurnishingFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "Furnished", label: "Furnished" },
  { value: "Semi-Furnished", label: "Semi-furnished" },
  { value: "Unfurnished", label: "Unfurnished" },
];

const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "under-50k", label: "Under ₹50k/mo" },
  { value: "under-50L", label: "Under ₹50 L" },
  { value: "under-2Cr", label: "Under ₹2 Cr" },
  { value: "over-2Cr", label: "₹2 Cr+" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "size-desc", label: "Largest first" },
];

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={{ ...type.label, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

interface FilterSheetProps {
  visible: boolean;
  filters: PropertyFilters;
  /** Live count of results the current draft would produce */
  countResults: (filters: PropertyFilters) => number;
  onApply: (filters: PropertyFilters) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet filter panel with grouped options.
 * Edits are drafted locally and only committed on "Show results".
 */
export function FilterSheet({ visible, filters, countResults, onApply, onClose }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<PropertyFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const activeCount = countActiveFilters(draft);
  const resultCount = countResults(draft);

  const patch = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => setDraft({ ...defaultFilters, query: draft.query });

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Dismiss filters" />

        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radius.xl + 4,
            borderTopRightRadius: radius.xl + 4,
            borderCurve: "continuous",
            maxHeight: "85%",
            paddingBottom: insets.bottom + spacing.md,
            boxShadow: shadow.raised,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.xl,
              paddingBottom: spacing.lg,
            }}
          >
            <Text style={{ ...type.title, color: colors.ink }}>Filters</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
              {activeCount > 0 && (
                <Pressable onPress={handleReset} hitSlop={8} accessibilityRole="button">
                  <Text style={{ ...type.label, color: colors.accent }}>Reset all</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.full,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color={colors.inkSecondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing.xl,
              gap: spacing.xl,
            }}
          >
            <FilterGroup label="Looking to">
              <FilterOptionRow
                options={PURPOSE_OPTIONS}
                value={draft.purpose}
                onChange={(v) => patch("purpose", v)}
              />
            </FilterGroup>
            <FilterGroup label="Property type">
              <FilterOptionRow
                options={TYPE_OPTIONS}
                value={draft.type}
                onChange={(v) => patch("type", v)}
              />
            </FilterGroup>
            <FilterGroup label="Bedrooms">
              <FilterOptionRow
                options={BHK_OPTIONS}
                value={draft.bhk}
                onChange={(v) => patch("bhk", v)}
              />
            </FilterGroup>
            <FilterGroup label="Budget">
              <FilterOptionRow
                options={PRICE_OPTIONS}
                value={draft.price}
                onChange={(v) => patch("price", v)}
              />
            </FilterGroup>
            <FilterGroup label="Furnishing">
              <FilterOptionRow
                options={FURNISHING_OPTIONS}
                value={draft.furnishing}
                onChange={(v) => patch("furnishing", v)}
              />
            </FilterGroup>
            <FilterGroup label="Sort by">
              <FilterOptionRow
                options={SORT_OPTIONS}
                value={draft.sort}
                onChange={(v) => patch("sort", v)}
              />
            </FilterGroup>
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Pressable
              onPress={handleApply}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 50,
                borderRadius: radius.md,
                borderCurve: "continuous",
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
                boxShadow: shadow.accent,
              })}
            >
              <Text style={{ ...type.emphasis, color: colors.onAccent }}>
                {resultCount === 1 ? "Show 1 property" : `Show ${resultCount} properties`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
