import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";

import { FilterOptionRow, MultiSelectChipRow } from "@/components/ui/chip";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import {
  AMENITY_OPTIONS,
  BHK_OPTIONS,
  BUDGET_BUY_MAX_OPTIONS,
  BUDGET_BUY_MIN_OPTIONS,
  BUDGET_RENT_MAX_OPTIONS,
  BUDGET_RENT_MIN_OPTIONS,
  countActiveFilters,
  defaultFilters,
  FURNISHING_OPTIONS,
  isRentLikePurpose,
  NON_RESIDENTIAL_TYPES,
  PROPERTY_TYPE_OPTIONS,
  SIZE_MAX_OPTIONS,
  SIZE_MIN_OPTIONS,
  type FurnishingFilter,
  type PropertyFilters,
  type PurposeFilter,
  type SortOption,
} from "@/lib/filters";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const PURPOSE_OPTIONS: { value: PurposeFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "rent", label: "Rent" },
  { value: "lease", label: "Lease" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "any", label: "All Types" },
  ...PROPERTY_TYPE_OPTIONS.map((t) => ({ value: t, label: t })),
];

const BHK_CHIP_OPTIONS = BHK_OPTIONS.map((v) => ({ value: v, label: `${v} BHK` }));

const FURNISHING_CHIP_OPTIONS: { value: FurnishingFilter; label: string }[] = FURNISHING_OPTIONS.map(
  (v) => ({ value: v, label: v }),
);

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Latest" },
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
    <View style={{ gap: spacing.sm, marginBottom: 4 }}>
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
        {subtitle ? (
          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

interface FilterSheetProps {
  visible: boolean;
  filters: PropertyFilters;
  countResults: (filters: PropertyFilters) => number;
  onApply: (filters: PropertyFilters) => void;
  onClose: () => void;
}

/** Filter Properties panel — fields aligned with web `/listings` FilterPanel. */
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
      minPrice: "",
      maxPrice: "",
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

  const showResidentialSpecs = !NON_RESIDENTIAL_TYPES.has(draft.type);

  const minPriceOptions = isRentLikePurpose(draft.purpose)
    ? BUDGET_RENT_MIN_OPTIONS
    : BUDGET_BUY_MIN_OPTIONS;
  const maxPriceOptions = isRentLikePurpose(draft.purpose)
    ? BUDGET_RENT_MAX_OPTIONS
    : BUDGET_BUY_MAX_OPTIONS;

  const resetAction =
    activeCount > 0 ? (
      <Pressable onPress={handleReset} hitSlop={8} accessibilityRole="button">
        <Text style={{ ...type.label, color: colors.accent, fontWeight: "700" }}>Reset all</Text>
      </Pressable>
    ) : undefined;

  return (
    <ModalSheet visible={visible} onClose={onClose} maxHeight="85%" avoidKeyboard>
      <ModalSheetHeader
        title={activeCount > 0 ? `Filter Properties (${activeCount})` : "Filter Properties"}
        rightAction={resetAction}
        onClose={onClose}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["3xl"],
          gap: spacing.lg,
        }}
      >


        <FilterGroup label="Looking to">
          <FilterOptionRow
            options={PURPOSE_OPTIONS}
            value={draft.purpose}
            onChange={handlePurposeChange}
          />
        </FilterGroup>

        <FilterGroup label="Property type">
          <FilterOptionRow
            options={TYPE_OPTIONS}
            value={draft.type === "commercial" ? "any" : draft.type}
            onChange={(v) => patch("type", v)}
          />
        </FilterGroup>

        {showResidentialSpecs ? (
          <FilterGroup label="Bedrooms (BHK)" subtitle="Select one or more">
            <MultiSelectChipRow
              options={BHK_CHIP_OPTIONS}
              values={draft.bhk}
              onToggle={(v) => toggleArrayItem("bhk", v)}
              showCheck
            />
          </FilterGroup>
        ) : null}

        <FilterGroup
          label="Budget"
          subtitle={
            isRentLikePurpose(draft.purpose) ? "Monthly rent range" : "Purchase price range"
          }
        >
          <Text style={{ ...type.caption, color: colors.inkMuted }}>Minimum</Text>
          <FilterOptionRow
            options={minPriceOptions.map((o) => ({
              value: o.value || "__none__",
              label: o.label,
            }))}
            value={draft.minPrice || "__none__"}
            onChange={(v) => patch("minPrice", v === "__none__" ? "" : v)}
          />
          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: spacing.sm }}>
            Maximum
          </Text>
          <FilterOptionRow
            options={maxPriceOptions.map((o) => ({
              value: o.value || "__none__",
              label: o.label,
            }))}
            value={draft.maxPrice || "__none__"}
            onChange={(v) => patch("maxPrice", v === "__none__" ? "" : v)}
          />
        </FilterGroup>

        <FilterGroup label="Size (sq.ft.)">
          <Text style={{ ...type.caption, color: colors.inkMuted }}>Minimum</Text>
          <FilterOptionRow
            options={SIZE_MIN_OPTIONS.map((o) => ({
              value: o.value || "__none__",
              label: o.label,
            }))}
            value={draft.minSize || "__none__"}
            onChange={(v) => patch("minSize", v === "__none__" ? "" : v)}
          />
          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: spacing.sm }}>
            Maximum
          </Text>
          <FilterOptionRow
            options={SIZE_MAX_OPTIONS.map((o) => ({
              value: o.value || "__none__",
              label: o.label,
            }))}
            value={draft.maxSize || "__none__"}
            onChange={(v) => patch("maxSize", v === "__none__" ? "" : v)}
          />
        </FilterGroup>

        {showResidentialSpecs ? (
          <FilterGroup label="Furnishing">
            <MultiSelectChipRow
              options={FURNISHING_CHIP_OPTIONS}
              values={draft.furnishing}
              onToggle={(v) => toggleArrayItem("furnishing", v)}
              showCheck
            />
          </FilterGroup>
        ) : null}

        <FilterGroup label="Amenities" subtitle="Must include all selected">
          <MultiSelectChipRow
            options={AMENITY_OPTIONS.map((a) => ({ value: a, label: a }))}
            values={draft.selectedAmenities}
            onToggle={(v) => toggleArrayItem("selectedAmenities", v)}
            showCheck
          />
        </FilterGroup>

        <View
          style={{
            gap: spacing.lg,
            paddingVertical: spacing.sm,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>RERA Approved Only</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }}>
                Show properties with valid RERA registration
              </Text>
            </View>
            <Switch
              value={draft.reraApprovedOnly}
              onValueChange={(val) => patch("reraApprovedOnly", val)}
              trackColor={{ false: colors.borderStrong, true: colors.accent }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>Featured Only</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }}>
                Show handpicked featured listings
              </Text>
            </View>
            <Switch
              value={draft.featuredOnly}
              onValueChange={(val) => patch("featuredOnly", val)}
              trackColor={{ false: colors.borderStrong, true: colors.accent }}
            />
          </View>
        </View>

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
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Pressable
          onPress={handleApply}
          accessibilityRole="button"
          style={({ pressed }) => ({
            height: 48,
            borderRadius: radius.md,
            borderCurve: "continuous",
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
            boxShadow: shadow.button,
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

