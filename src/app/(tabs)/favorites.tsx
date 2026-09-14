import React, { useMemo } from "react";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { PropertyCard } from "@/components/ui/property-card";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import { colors, spacing } from "@/theme/tokens";

export default function FavoritesScreen() {
  const router = useRouter();
  const { properties, favorites } = useApp();

  const saved = useMemo(
    () => properties.filter((p) => favorites.includes(p.id)),
    [properties, favorites],
  );

  const subtitle =
    saved.length === 0
      ? "Homes you heart will appear here"
      : saved.length === 1
        ? "1 saved property"
        : `${saved.length} saved properties`;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["3xl"],
          gap: spacing.lg,
          flexGrow: 1,
        }}

        ListHeaderComponent={
          <ScreenNavbar eyebrow="Shortlist" title="Saved" subtitle={subtitle} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            message="Tap the heart on any property to keep it here for later."
            actionLabel="Explore homes"
            onAction={() => router.push("/(tabs)/explore")}
          />
        }
      />
    </SafeAreaView>
  );
}
