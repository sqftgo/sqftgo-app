import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/components/ui/icons";

import { ListingPacksPanel } from "@/features/listing-packs/ListingPacksPanel";
import { useApp } from "@/context/AppContext";
import { colors, spacing, type } from "@/theme/tokens";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { canAccessDealerDashboard } = useApp();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={{ ...type.heading, color: colors.ink }}>Listing packs</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <ListingPacksPanel canBuy={canAccessDealerDashboard} />
      </ScrollView>
    </SafeAreaView>
  );
}
