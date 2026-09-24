import React from "react";
import { Text, View } from "react-native";

import { CheckCircle2, ShieldCheck } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { PropertySection } from "./PropertySection";

const CHECKS = [
  "Title registry documents checked",
  "Municipal property tax clearance verified",
  "Physical land verification completed",
];

export function ReraSection({ reraId }: { reraId: string }) {
  return (
    <PropertySection title="RERA & title verification">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          backgroundColor: colors.successSoft,
        }}
      >
        <ShieldCheck size={24} color={colors.success} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...type.emphasis, color: colors.ink }}>Title deed & registration vetted</Text>
          <Text selectable style={{ ...type.caption, color: colors.inkSecondary }}>
            RERA Reg. No: {reraId}
          </Text>
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        {CHECKS.map((check) => (
          <View key={check} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={{ ...type.body, color: colors.inkSecondary }}>{check}</Text>
          </View>
        ))}
      </View>
    </PropertySection>
  );
}
