import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

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
import type { ListingFilter } from "@/data/listing-filters";
import { isFilterOn } from "@/hooks/useListingFilters";

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
  listingFilters?: ListingFilter[];
}

/** Filter Properties panel — fields aligned with web `/listings` FilterPanel. */
export function FilterSheet({
  visible,
  filters,
  countResults,
  onApply,
  onClose,
  listingFilters = [],
}: FilterSheetProps) {
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
  const on = (key: string) => (listingFilters.length === 0 ? true : isFilterOn(listingFilters, key));
  const customFilters = listingFilters.filter(
    (f) => f.active && (f.kind === "text" || f.kind === "toggle" || f.kind === "multi"),
  );
  const bhkOptions =
    listingFilters.find((f) => f.key === "bhk")?.options?.length
      ? listingFilters.find((f) => f.key === "bhk")!.options
      : BHK_CHIP_OPTIONS;
  const furnishingOptions =
    listingFilters.find((f) => f.key === "furnishing")?.options?.length
      ? listingFilters.find((f) => f.key === "furnishing")!.options.map((o) => ({
          value: o.value as FurnishingFilter,
          label: o.label,
        }))
      : FURNISHING_CHIP_OPTIONS;

  const setExtra = (key: string, value: string | string[] | boolean) => {
    triggerHaptic();
    setDraft((prev) => ({ ...prev, extra: { ...(prev.extra ?? {}), [key]: value } }));
  };

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
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
          gap: spacing.xl,
        }}
      >

        {on("purpose") ? (
        <FilterGroup label={listingFilters.find((f) => f.key === "purpose")?.label || "Looking to"}>
          <FilterOptionRow
            options={PURPOSE_OPTIONS}
            value={draft.purpose}
            onChange={handlePurposeChange}
          />
        </FilterGroup>
        ) : null}

        {on("type") ? (
        <FilterGroup label={listingFilters.find((f) => f.key === "type")?.label || "Property type"}>
          <FilterOptionRow
            options={TYPE_OPTIONS}
            value={draft.type === "commercial" ? "any" : draft.type}
            onChange={(v) => patch("type", v)}
          />
        </FilterGroup>
        ) : null}

        {showResidentialSpecs && on("bhk") ? (
          <FilterGroup label={listingFilters.find((f) => f.key === "bhk")?.label || "Bedrooms (BHK)"} subtitle="Select one or more">
            <MultiSelectChipRow
              options={bhkOptions}
              values={draft.bhk}
              onToggle={(v) => toggleArrayItem("bhk", v)}
              showCheck
            />
          </FilterGroup>
        ) : null}

        {on("price") ? (
        <FilterGroup
          label={listingFilters.find((f) => f.key === "price")?.label || "Budget"}
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
        ) : null}

        {on("size") ? (
        <FilterGroup label={listingFilters.find((f) => f.key === "size")?.label || "Size (sq.ft.)"}>
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
        ) : null}

        {showResidentialSpecs && on("furnishing") ? (
          <FilterGroup label={listingFilters.find((f) => f.key === "furnishing")?.label || "Furnishing"}>
            <MultiSelectChipRow
              options={furnishingOptions}
              values={draft.furnishing}
              onToggle={(v) => toggleArrayItem("furnishing", v)}
              showCheck
            />
          </FilterGroup>
        ) : null}

        {on("amenities") ? (
        <FilterGroup label={listingFilters.find((f) => f.key === "amenities")?.label || "Amenities"} subtitle="Must include all selected">
          <MultiSelectChipRow
            options={AMENITY_OPTIONS.map((a) => ({ value: a, label: a }))}
            values={draft.selectedAmenities}
            onToggle={(v) => toggleArrayItem("selectedAmenities", v)}
            showCheck
          />
        </FilterGroup>
        ) : null}

        {(on("rera") || on("featured")) ? (
        <View
          style={{
            gap: spacing.lg,
            paddingVertical: spacing.sm,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          {on("rera") ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>
                {listingFilters.find((f) => f.key === "rera")?.label || "RERA Approved Only"}
              </Text>
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
          ) : null}

          {on("featured") ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>
                {listingFilters.find((f) => f.key === "featured")?.label || "Featured Only"}
              </Text>
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
          ) : null}
        </View>
        ) : null}

        {customFilters.map((def) => {
          const extraVal = draft.extra?.[def.key];
          if (def.kind === "toggle") {
            return (
              <View
                key={def.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ ...type.emphasis, color: colors.ink, flex: 1 }}>{def.label}</Text>
                <Switch
                  value={Boolean(extraVal)}
                  onValueChange={(val) => setExtra(def.key, val)}
                  trackColor={{ false: colors.borderStrong, true: colors.accent }}
                />
              </View>
            );
          }
          if (def.kind === "multi") {
            const selected = Array.isArray(extraVal) ? extraVal.map(String) : [];
            return (
              <FilterGroup key={def.id} label={def.label}>
                <MultiSelectChipRow
                  options={def.options}
                  values={selected}
                  onToggle={(v) => {
                    const next = selected.includes(v)
                      ? selected.filter((x) => x !== v)
                      : [...selected, v];
                    setExtra(def.key, next);
                  }}
                  showCheck
                />
              </FilterGroup>
            );
          }
          return (
            <FilterGroup key={def.id} label={def.label}>
              <TextInput
                value={typeof extraVal === "string" ? extraVal : ""}
                onChangeText={(t) => setExtra(def.key, t)}
                placeholder={def.label}
                placeholderTextColor={colors.inkMuted}
                style={{
                  ...type.body,
                  color: colors.ink,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              />
            </FilterGroup>
          );
        })}

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
