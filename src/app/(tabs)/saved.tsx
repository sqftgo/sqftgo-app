import { useQueries } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text } from "react-native";

import { PropertyCardSkeleton, Screen, SwipeRow } from "@/components/ds";
import { EmptyState } from "@/components/ui/empty-state";
import { Heart, Trash2 } from "@/components/ui/icons";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { apiGetProperty } from "@/lib/api/services/properties";
import { colors, spacing, type } from "@/theme/tokens";

export default function SavedPropertiesScreen() {
  const router = useRouter();
  const { properties, favorites, isApiMode, isLoggedIn, mergeProperties, toggleFavorite } = useApp();

  const known = useMemo(() => new Set(properties.map((p) => p.id)), [properties]);
  const missing = useMemo(() => favorites.filter((id) => !known.has(id)), [favorites, known]);

  const fetched = useQueries({
    queries: missing.map((id) => ({
      queryKey: ["property", id],
      queryFn: async () => {
        const property = await apiGetProperty(id);
        mergeProperties([property]);
        return property;
      },
      enabled: isApiMode,
      retry: false,
    })),
  });

  const saved = useMemo(() => {
    const byId = new Map(properties.map((p) => [p.id, p]));
    return favorites.map((id) => byId.get(id)).filter((p): p is Property => Boolean(p));
  }, [properties, favorites]);

  const loading = isApiMode && fetched.some((q) => q.isPending);

  if (!isLoggedIn && favorites.length === 0) {
    return (
      <Screen title="Saved" root>
        <EmptyState
          icon={Heart}
          title="Save homes you love"
          message="Sign in and tap the heart on any listing to keep a shortlist across your devices."
          actionLabel="Sign in"
          onAction={() => router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Saved" root scroll={false}>
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeRow actions={[{ label: "Remove", icon: Trash2, tone: "danger", onPress: () => toggleFavorite(item.id) }]}>
            <PropertyCard property={item} />
          </SwipeRow>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          saved.length > 0 ? (
            <Text style={styles.count}>
              {saved.length === 1 ? "1 saved home" : `${saved.length} saved homes`}
            </Text>
          ) : null
        }
        ListFooterComponent={loading ? <PropertyCardSkeleton /> : null}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              message="Tap the heart on any listing to keep it here for quick access."
              actionLabel="Explore homes"
              onAction={() => router.push("/(tabs)/explore" as Href)}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing["4xl"], gap: spacing.lg, flexGrow: 1 },
  count: { ...type.caption, color: colors.inkMuted },
});