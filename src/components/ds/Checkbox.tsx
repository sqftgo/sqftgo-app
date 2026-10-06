import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Check } from "@/components/ui/icons";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

/** Labelled checkbox row for consent and confirmations. */
export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Check size={14} color={colors.onAccent} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: touchTarget, flexDirection: "row", alignItems: "center", gap: spacing.md },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { ...type.body, color: colors.inkSecondary, flex: 1 },
});
