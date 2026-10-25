import * as Haptics from "expo-haptics";
import { type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Chip, EmptyState, Screen } from "@/components/ds";
import { DestinationCard } from "@/components/destinations/destination-card";
import { MapPin, Search, X } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { DESTINATION_TAGS, DESTINATIONS } from "@/data/destinations";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function DestinationsHubScreen() {
  const { properties } = useApp();
  const [tag, setTag] = useState<string>("all");
  const [query, setQuery] = useState("");

  const listingCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of properties) {
      if (p.status !== "Active") continue;
      const key = p.city.trim().toLowerCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [properties]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = DESTINATIONS.filter((d) => {
      if (tag !== "all" && d.tag !== tag) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.vibe.toLowerCase().includes(q) ||
        d.topLocalities.some((l) => l.toLowerCase().includes(q))
      );
    });
    return [...base].sort((a, b) => {
      const ca = listingCounts.get(a.name.toLowerCase()) ?? 0;
      const cb = listingCounts.get(b.name.toLowerCase()) ?? 0;
      return cb - ca;
    });
  }, [tag, query, listingCounts]);

  const featured = !query.trim() && tag === "all" ? list[0] : undefined;
  const grid = featured ? list.slice(1) : list;

  const selectTag = (next: string) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync().catch(() => {});
    setTag(next);
  };

  const countFor = (name: string) => listingCounts.get(name.toLowerCase()) ?? 0;

  return (
    <Screen
      title="Cities"
      subtitle="Markets with homes, localities and dealers"
      fallbackHref={"/(tabs)" as Href}
      scroll={false}
      contentStyle={styles.screen}
    >
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <Search size={18} color={colors.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search city or locality"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
              <X size={16} color={colors.inkMuted} />
            </Pressable>
          ) : null}
        </View>
        <FlatList
          horizontal
          data={["all", ...DESTINATION_TAGS]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <Chip
              label={item === "all" ? "All" : item}
              selected={tag === item}
              onPress={() => selectTag(item)}
            />
          )}
        />
      </View>

      <FlatList
        style={styles.flex}
        data={grid}
        keyExtractor={(item) => item.slug}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          featured ? (
            <View style={styles.featuredWrap}>
              <Text style={styles.sectionLabel}>Featured market</Text>
              <DestinationCard
                destination={featured}
                variant="featured"
                listingCount={countFor(featured.name)}
              />
              {grid.length > 0 ? <Text style={styles.sectionLabel}>All markets</Text> : null}
            </View>
          ) : (
            <Text style={styles.sectionLabel}>
              {list.length} {list.length === 1 ? "market" : "markets"}
            </Text>
          )
        }
        ListEmptyComponent={
          <EmptyState
            icon={MapPin}
            title="No markets match"
            message="Try another city name, locality, or clear the filters."
            actionLabel="Clear filters"
            onAction={() => {
              setQuery("");
              selectTag("all");
            }}
          />
        }
        renderItem={({ item }) => (
          <DestinationCard destination={item} variant="grid" listingCount={countFor(item.name)} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, gap: 0, paddingTop: 0, paddingBottom: 0 },
  flex: { flex: 1 },
  toolbar: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    ...type.body,
    color: colors.ink,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  row: { gap: spacing.md },
  featuredWrap: { gap: spacing.md, marginBottom: spacing.sm },
  sectionLabel: {
    ...type.caption,
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
