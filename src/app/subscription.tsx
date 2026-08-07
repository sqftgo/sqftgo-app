import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Sparkles } from "@/components/ui/icons";

import { useApp } from "@/context/AppContext";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    blurb: "Basic listing tools for new dealers",
    features: ["Up to platform listing cap", "Inquiries & visits", "Directory profile"],
  },
  {
    name: "Growth",
    price: "Coming soon",
    blurb: "More visibility and featured slots",
    features: ["Featured listings", "Priority support", "Analytics exports"],
  },
  {
    name: "Pro",
    price: "Coming soon",
    blurb: "For high-volume brokerages",
    features: ["Team seats", "Advanced reporting", "Custom branding"],
  },
];

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
        <Text style={{ ...type.heading, color: colors.ink }}>Subscription</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <View
          style={{
            backgroundColor: colors.accentSoft,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Sparkles size={20} color={colors.accent} />
          <Text style={{ ...type.emphasis, color: colors.ink }}>Plans coming soon</Text>
          <Text style={{ ...type.body, color: colors.inkSecondary }}>
            Dealer billing is not live in this app. Upgrade buttons are disabled — no charges,
            Razorpay, or RevenueCat for dealers yet.
          </Text>
        </View>

        {!canAccessDealerDashboard ? (
          <Text style={{ ...type.caption, color: colors.inkMuted }}>
            Full dealer tools still require broker role approval.
          </Text>
        ) : null}

        {PLANS.map((plan) => (
          <View
            key={plan.name}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.sm,
              boxShadow: shadow.card,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...type.heading, color: colors.ink }}>{plan.name}</Text>
              <Text style={{ ...type.emphasis, color: colors.accent }}>{plan.price}</Text>
            </View>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>{plan.blurb}</Text>
            {plan.features.map((f) => (
              <Text key={f} style={{ ...type.caption, color: colors.inkMuted }}>
                · {f}
              </Text>
            ))}
            <Pressable
              disabled
              style={{
                marginTop: spacing.sm,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceSubtle,
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7,
              }}
            >
              <Text style={{ ...type.label, color: colors.inkMuted }}>Coming soon</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
