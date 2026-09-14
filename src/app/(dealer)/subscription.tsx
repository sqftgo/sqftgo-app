import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListingPacksPanel } from "@/features/listing-packs/ListingPacksPanel";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import { colors, spacing } from "@/theme/tokens";

export default function DealerSubscriptionScreen() {
  const { canAccessDealerDashboard } = useApp();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl }}>
        <ScreenNavbar
          eyebrow="Dealer portal"
          title="Listing packs"
          subtitle="Buy extra property slots"
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <ListingPacksPanel canBuy={canAccessDealerDashboard} />
      </ScrollView>
    </SafeAreaView>
  );
}
