import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import { colors, spacing, type } from "@/theme/tokens";

export default function FavoritesScreen() {
  const router = useRouter();
  const { properties, favorites } = useApp();

  const saved = useMemo(
    () => properties.filter((p) => favorites.includes(p.id)),
    [properties, favorites],
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Text style={{ ...type.title, color: colors.ink }}>Saved</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          {saved.length === 0
            ? "Homes you heart will appear here"
            : saved.length === 1
              ? "1 saved property"
              : `${saved.length} saved properties`}
        </Text>
      </View>

      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
          flexGrow: 1,
        }}
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
