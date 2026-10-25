import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, MapPin, SlidersHorizontal } from "@/components/ui/icons";

import { SearchBar } from "@/components/ui/search-bar";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

interface ExploreNavbarProps {
  city: string;
  query: string;
  onQueryChange: (query: string) => void;
  onPressCity: () => void;
  onPressFilters: () => void;
  activeFilterCount: number;
  /** Undefined while the first page loads; null when the search failed. */
  resultCount?: number | null;
  /** True when more pages may still load. */
  hasMore?: boolean;
  sortLabel: string;
}

/**
 * Explore top bar — city context → search → filters → result meta.
 * Keeps the main browse flow readable: where, what, how many.
 */
export function ExploreNavbar({
  city,
  query,
  onQueryChange,
  onPressCity,
  onPressFilters,
  activeFilterCount,
  resultCount,
  hasMore,
  sortLabel,
}: ExploreNavbarProps) {
  const resultLabel =
    resultCount === null
      ? "Couldn't load results"
      : resultCount === undefined
        ? "Searching listings…"
        : resultCount === 0
          ? `No matches in ${city}`
          : hasMore
            ? `${resultCount}+ listings in ${city}`
            : resultCount === 1
              ? `1 listing in ${city}`
              : `${resultCount} listings in ${city}`;

  return (
    <View
      style={{
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
        gap: spacing.md,
        backgroundColor: colors.bg,
      }}
    >
      <Pressable
        onPress={onPressCity}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Change city, currently ${city}`}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: 2,
          paddingHorizontal: 2,
          borderRadius: radius.sm,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            borderCurve: "continuous",
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPin size={16} color={colors.accent} strokeWidth={2.2} />
        </View>
        <View style={{ gap: 1 }}>
          <Text
            style={{
              ...type.micro,
              color: colors.inkMuted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontWeight: "600",
            }}
          >
            Browse properties in
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{
                ...type.title,
                color: colors.ink,
                fontSize: 22,
                fontWeight: "700",
                letterSpacing: -0.4,
              }}
            >
              {city}
            </Text>
            <ChevronDown size={15} color={colors.inkMuted} style={{ marginTop: 2 }} />
          </View>
        </View>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={onQueryChange}
            placeholder={`Search locality or keyword in ${city}`}
          />
        </View>
        <Pressable
          onPress={onPressFilters}
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Open filters and sort"
          }
          style={({ pressed }) => ({
            width: 46,
            height: 46,
            borderRadius: radius.sm,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: activeFilterCount > 0 ? colors.accentSoft : colors.surface,
            borderWidth: 1,
            borderColor: activeFilterCount > 0 ? colors.accentBorder : colors.border,
            opacity: pressed ? 0.85 : 1,
            boxShadow: shadow.card,
          })}
        >
          <SlidersHorizontal
            size={18}
            color={activeFilterCount > 0 ? colors.accent : colors.ink}
            strokeWidth={activeFilterCount > 0 ? 2.2 : 1.8}
          />
          {activeFilterCount > 0 ? (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                borderRadius: radius.xs,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                borderWidth: 1.5,
                borderColor: colors.bg,
              }}
            >
              <Text style={{ ...type.micro, color: colors.onAccent, fontWeight: "700" }}>
                {activeFilterCount > 9 ? "9+" : activeFilterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <Text style={{ ...type.caption, color: colors.inkMuted, flex: 1 }} numberOfLines={1}>
          {resultLabel}
          {activeFilterCount > 0
            ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}`
            : ""}
        </Text>
        <Pressable
          onPress={onPressFilters}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortLabel}. Open filters to change.`}
        >
          <Text style={{ ...type.caption, color: colors.inkSecondary, fontWeight: "600" }}>
            {sortLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
