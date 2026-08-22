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
  resultCount: number;
  sortLabel: string;
}

/**
 * Explore-only top bar — search-first pattern used by Airbnb / Zillow / Housing:
 * location control → unified search + filters → result meta.
 * Styled with SqftGo tokens so it can roll out to other tabs later.
 */
export function ExploreNavbar({
  city,
  query,
  onQueryChange,
  onPressCity,
  onPressFilters,
  activeFilterCount,
  resultCount,
  sortLabel,
}: ExploreNavbarProps) {
  return (
    <View
      style={{
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.md,
        backgroundColor: colors.bg,
      }}
    >
      {/* Location — primary context, not a page title */}
      <Pressable
        onPress={onPressCity}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Change city, currently ${city}`}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          marginLeft: -spacing.sm,
          borderRadius: radius.md,
          backgroundColor: pressed ? colors.surfaceSubtle : "transparent",
        })}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: radius.full,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPin size={14} color={colors.accent} strokeWidth={2.2} />
        </View>
        <View style={{ gap: 1 }}>
          <Text style={{ ...type.micro, color: colors.inkMuted }}>Searching in</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ ...type.heading, color: colors.ink }}>{city}</Text>
            <ChevronDown size={16} color={colors.inkMuted} />
          </View>
        </View>
      </Pressable>

      {/* Search + filters in one surface (marketplace pattern) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={onQueryChange}
            placeholder="Locality, project, or type"
          />
        </View>
        <Pressable
          onPress={onPressFilters}
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterCount > 0
              ? `Filters, ${activeFilterCount} active`
              : "Open filters"
          }
          style={({ pressed }) => ({
            width: 46,
            height: 46,
            borderRadius: radius.md,
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
                borderRadius: radius.full,
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

      {/* Result meta — quiet, secondary */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          {resultCount === 1 ? "1 property" : `${resultCount} properties`}
          {activeFilterCount > 0
            ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}`
            : ""}
        </Text>
        <Pressable onPress={onPressFilters} hitSlop={8} accessibilityRole="button">
          <Text style={{ ...type.caption, color: colors.inkSecondary, fontWeight: "500" }}>
            {sortLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
