import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, type } from "@/theme/tokens";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceSubtle, fg: colors.inkSecondary },
  info: { bg: colors.infoSoft, fg: colors.info },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  accent: { bg: colors.accentSoft, fg: colors.accent },
};

/** Maps any status string used across listings, visits, inquiries, KYC and bookings to a tone. */
export function toneForStatus(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (["active", "approved", "confirmed", "completed", "verified", "paid"].includes(s)) return "success";
  if (["pending", "pending review", "pending approval", "submitted", "new"].includes(s)) return "warning";
  if (["rejected", "cancelled", "suspended", "failed", "expired"].includes(s)) return "danger";
  if (["sold", "rented"].includes(s)) return "info";
  return "neutral";
}

export function StatusBadge({ label, tone }: { label: string; tone?: BadgeTone }) {
  const t = TONES[tone ?? toneForStatus(label)];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]} accessibilityLabel={`Status: ${label}`}>
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  text: { ...type.micro },
});
