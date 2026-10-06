import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { IconComponent } from "@/components/ui/icons";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: IconComponent;
  /** Short context under the value, e.g. "3 new this week". */
  hint?: string;
  onPress?: () => void;
}

/** KPI tile for dashboards. Lay out two per row with `StatGrid`. */
export function StatCard({ label, value, icon: Icon, hint, onPress }: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${label}, ${value}${hint ? `, ${hint}` : ""}`}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surfaceSubtle }]}
    >
      <View style={styles.head}>
        {Icon ? (
          <View style={styles.icon}>
            <Icon size={16} color={colors.accent} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text style={styles.hint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: {
    flexGrow: 1,
    flexBasis: "45%",
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...type.caption, color: colors.inkMuted, flexShrink: 1 },
  value: { ...type.hero, color: colors.ink, fontVariant: ["tabular-nums"] },
  hint: { ...type.caption, color: colors.inkSecondary },
});
