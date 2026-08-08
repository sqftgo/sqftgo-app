import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { FilterOptionRow, MultiSelectChipRow } from "@/components/ui/chip";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import {
  COMMERCIAL_TYPES,
  countActiveFilters,
  defaultFilters,
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
  { value: "Commercial Space", label: "Commercial" },
  { value: "Office Space", label: "Office" },
  { value: "Shop", label: "Shop" },
];

const BHK_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "1 BHK" },
  { value: 2, label: "2 BHK" },
  { value: 3, label: "3 BHK" },
  { value: 4, label: "4 BHK" },
  { value: 5, label: "5+ BHK" },
];

const FURNISHING_OPTIONS: { value: FurnishingFilter; label: string }[] = [
  { value: "Furnished", label: "Furnished" },
  { value: "Semi-Furnished", label: "Semi-Furnished" },
  { value: "Unfurnished", label: "Unfurnished" },
];

const RENT_PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "all", label: "Any Budget" },
  { value: "under-25k", label: "Under ₹25k/mo" },
  { value: "25k-50k", label: "₹25k - ₹50k/mo" },
  { value: "50k-1L", label: "₹50k - ₹1 Lakh/mo" },
  { value: "over-1L", label: "₹1 Lakh+/mo" },
];

const BUY_PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "all", label: "Any Budget" },
  { value: "under-50L", label: "Under ₹50 Lakhs" },
  { value: "50L-1Cr", label: "₹50 Lakhs - ₹1 Cr" },
  { value: "1Cr-2Cr", label: "₹1 Cr - ₹2 Cr" },
  { value: "over-2Cr", label: "₹2 Cr+" },
];

const ALL_PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "all", label: "Any Budget" },
  { value: "under-50k", label: "Under ₹50k/mo" },
  { value: "under-50L", label: "Under ₹50 Lakhs" },
  { value: "under-2Cr", label: "Under ₹2 Cr" },
  { value: "over-2Cr", label: "₹2 Cr+" },
];

const POPULAR_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Power Backup",
  "Security",
  "Private Garden",
  "Elevator",
  "Clubhouse",
  "Parking",
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "size-desc", label: "Largest first" },
];

function FilterGroup({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View>
        <Text
          style={{
            ...type.label,
            color: colors.inkMuted,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
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
 * High-performance bottom-sheet filter panel.
 * Supports multi-select arrays, dynamic price intervals, conditional specs, and tactile haptics.
 */
export function FilterSheet({ visible, filters, countResults, onApply, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState<PropertyFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const activeCount = countActiveFilters(draft);
  const resultCount = countResults(draft);

  const triggerHaptic = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
  };

  const patch = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => {
    triggerHaptic();
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = <T,>(field: "bhk" | "furnishing" | "selectedAmenities", value: T) => {
    triggerHaptic();
    setDraft((prev) => {
      const list = (prev[field] as T[]) || [];
      const updated = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...prev, [field]: updated };
    });
  };

  const handlePurposeChange = (purpose: PurposeFilter) => {
    triggerHaptic();
    setDraft((prev) => ({
      ...prev,
      purpose,
      price: "all", // Clear out-of-bounds price scale on purpose change
    }));
  };

  const handleReset = () => {
    triggerHaptic();
    setDraft({ ...defaultFilters, query: draft.query });
  };

  const handleApply = () => {
    triggerHaptic();
    onApply(draft);
    onClose();
  };

  const isResidential =
    draft.type === "all" ||
    !COMMERCIAL_TYPES.has(draft.type as any) && draft.type !== "Industrial Plot";

  const priceOptions =
    draft.purpose === "rent"
      ? RENT_PRICE_OPTIONS
      : draft.purpose === "buy"
      ? BUY_PRICE_OPTIONS
      : ALL_PRICE_OPTIONS;

  const resetAction =
    activeCount > 0 ? (
      <Pressable onPress={handleReset} hitSlop={8} accessibilityRole="button">
        <Text style={{ ...type.label, color: colors.accent, fontWeight: "700" }}>Reset all</Text>
      </Pressable>
    ) : undefined;

  return (
    <ModalSheet visible={visible} onClose={onClose} maxHeight="88%">
      <ModalSheetHeader
        title={activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
        rightAction={resetAction}
        onClose={onClose}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
          gap: spacing.xl,
        }}
      >
        {/* Purpose */}
        <FilterGroup label="Looking to">
          <FilterOptionRow
            options={PURPOSE_OPTIONS}
            value={draft.purpose}
            onChange={handlePurposeChange}
          />
        </FilterGroup>

        {/* Property Type */}
        <FilterGroup label="Property type">
          <FilterOptionRow
            options={TYPE_OPTIONS}
            value={draft.type}
            onChange={(v) => patch("type", v)}
          />
        </FilterGroup>

        {/* Bedrooms (BHK) - Multi-select (Conditional for residential) */}
        {isResidential && (
          <FilterGroup label="Bedrooms (BHK)" subtitle="Select one or multiple configurations">
            <MultiSelectChipRow
              options={BHK_OPTIONS}
              values={draft.bhk}
              onToggle={(v) => toggleArrayItem("bhk", v)}
              showCheck
            />
          </FilterGroup>
        )}

        {/* Budget Brackets (Dynamic based on purpose) */}
        <FilterGroup label="Budget" subtitle={draft.purpose === "rent" ? "Monthly rental range" : "Purchase price range"}>
          <FilterOptionRow
            options={priceOptions}
            value={draft.price}
            onChange={(v) => patch("price", v)}
          />
        </FilterGroup>

        {/* Furnishing - Multi-select (Conditional for residential) */}
        {isResidential && (
          <FilterGroup label="Furnishing">
            <MultiSelectChipRow
              options={FURNISHING_OPTIONS}
              values={draft.furnishing}
              onToggle={(v) => toggleArrayItem("furnishing", v)}
              showCheck
            />
          </FilterGroup>
        )}

        {/* Amenities - Multi-select */}
        <FilterGroup label="Amenities" subtitle="Tap to filter by specific features">
          <MultiSelectChipRow
            options={POPULAR_AMENITIES.map((a) => ({ value: a, label: a }))}
            values={draft.selectedAmenities}
            onToggle={(v) => toggleArrayItem("selectedAmenities", v)}
            showCheck
          />
        </FilterGroup>

        {/* Verified & Premium Switches */}
        <View
          style={{
            gap: spacing.lg,
            paddingVertical: spacing.sm,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* RERA Approved Switch */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>RERA Verified Only</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }}>
                Show properties with valid government RERA registration
              </Text>
            </View>
            <Switch
              value={draft.reraApprovedOnly}
              onValueChange={(val) => patch("reraApprovedOnly", val)}
              trackColor={{ false: colors.borderStrong, true: colors.accent }}
            />
          </View>

          {/* Featured Switch */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>Featured Listings Only</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }}>
                Display premium handpicked properties
              </Text>
            </View>
            <Switch
              value={draft.featuredOnly}
              onValueChange={(val) => patch("featuredOnly", val)}
              trackColor={{ false: colors.borderStrong, true: colors.accent }}
            />
          </View>
        </View>

        {/* Sort By */}
        <FilterGroup label="Sort by">
          <FilterOptionRow
            options={SORT_OPTIONS}
            value={draft.sort}
            onChange={(v) => patch("sort", v)}
          />
        </FilterGroup>
      </ScrollView>

      {/* Footer CTA */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
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
    </ModalSheet>
  );
}

