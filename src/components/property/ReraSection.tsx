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

function formatVerifiedDate(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return raw.trim();
  return new Date(t).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Shows only checks/IDs provided by the listing — never invents RERA status. */
export function ReraSection({
  reraApproved,
  reraId,
  checks,
  verifiedDate,
}: {
  reraApproved?: boolean;
  reraId?: string;
  checks?: VerificationChecks;
  verifiedDate?: string;
}) {
  const passed = checks
    ? (Object.keys(CHECK_LABELS) as (keyof VerificationChecks)[]).filter((k) => checks[k])
    : [];
  const id = reraId?.trim();
  const showRera = Boolean(reraApproved || id);
  if (!showRera && passed.length === 0) return null;

  const verifiedLabel = formatVerifiedDate(verifiedDate);

  return (
    <PropertySection title="RERA & verification">
      {showRera ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            backgroundColor: reraApproved ? colors.successSoft : colors.surfaceSubtle,
          }}
        >
          <ShieldCheck size={24} color={reraApproved ? colors.success : colors.inkMuted} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...type.emphasis, color: colors.ink }}>
              {reraApproved ? "RERA approved" : "RERA ID on file"}
            </Text>
            {id ? (
              <Text selectable style={{ ...type.caption, color: colors.inkSecondary }}>
                Reg. no. {id}
              </Text>
            ) : (
              <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                Registration number not shared by the lister
              </Text>
            )}
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
          {verifiedLabel ? (
            <Text style={{ ...type.caption, color: colors.inkMuted }}>Verified on {verifiedLabel}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={{ ...type.caption, color: colors.inkMuted }}>
        Always verify RERA details and title documents yourself before paying any token amount.
      </Text>
    </PropertySection>
  );
}
