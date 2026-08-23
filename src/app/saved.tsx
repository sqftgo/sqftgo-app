import React, { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bookmark, ChevronLeft, Heart } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function SavedPropertiesScreen() {
  const router = useRouter();
  const { properties, favorites } = useApp();

  const saved = useMemo(
    () => properties.filter((p) => favorites.includes(p.id)),
    [properties, favorites],
  );

  const subtitle =
    saved.length === 0
      ? "Homes and properties you bookmark will appear here"
      : saved.length === 1
        ? "1 shortlisted property"
        : `${saved.length} shortlisted properties`;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Navbar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceSubtle,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: spacing.sm }}>
          <Text style={{ ...type.caption, color: colors.inkMuted }}>Shortlist</Text>
          <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>
            Saved Properties
          </Text>
        </View>

        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bookmark size={18} color={colors.accent} strokeWidth={2.2} />
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing["3xl"],
          gap: spacing.lg,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          saved.length > 0 ? (
            <View style={{ paddingBottom: spacing.xs }}>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>{subtitle}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            message="Tap the heart on any property listing in Explore or Home to keep it here for quick access."
            actionLabel="Explore homes"
            onAction={() => router.push("/(tabs)/explore")}
          />
        }
      />
    </SafeAreaView>
  );
}
