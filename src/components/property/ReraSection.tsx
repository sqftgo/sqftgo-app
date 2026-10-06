import React from "react";
import { Text, View } from "react-native";

import { CheckCircle2, ShieldCheck } from "@/components/ui/icons";
import type { VerificationChecks } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { PropertySection } from "./PropertySection";

const CHECK_LABELS: Record<keyof VerificationChecks, string> = {
  titleDeed: "Title deed checked",
  taxClearance: "Property tax clearance verified",
  utilitiesCheck: "Utility connections verified",
  physicalVerification: "Physical site verification done",
  structuralVetted: "Structure vetted",
};

export function ReraSection({
  reraId,
  checks,
  verifiedDate,
}: {
  reraId?: string;
  checks?: VerificationChecks;
  verifiedDate?: string;
}) {
  const passed = checks
    ? (Object.keys(CHECK_LABELS) as (keyof VerificationChecks)[]).filter((k) => checks[k])
    : [];
  if (!reraId && passed.length === 0) return null;

  return (
    <PropertySection title="RERA & verification">
      {reraId ? (
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
            <Text style={{ ...type.emphasis, color: colors.ink }}>RERA registered</Text>
            <Text selectable style={{ ...type.caption, color: colors.inkSecondary }}>
              Reg. no. {reraId}
            </Text>
          </View>
        </View>
      ) : null}
      {passed.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {passed.map((key) => (
            <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={{ ...type.body, color: colors.inkSecondary }}>{CHECK_LABELS[key]}</Text>
            </View>
          ))}
          {verifiedDate ? (
            <Text style={{ ...type.caption, color: colors.inkMuted }}>Verified on {verifiedDate}</Text>
          ) : null}
        </View>
      ) : null}
      <Text style={{ ...type.caption, color: colors.inkMuted }}>
        Always verify RERA details and title documents yourself before paying any token amount.
      </Text>
    </PropertySection>
  );
}
