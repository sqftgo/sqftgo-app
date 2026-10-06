import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, type } from "@/theme/tokens";

/** Compact progress header for multi-step forms: "Step 2 of 5 · Location" + bar. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const total = steps.length;
  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${total}: ${steps[current]}`}
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
    >
      <Text style={styles.caption}>
        Step {current + 1} of {total}
        <Text style={styles.name}> · {steps[current]}</Text>
      </Text>
      <View style={styles.bar}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.segment, i <= current && styles.segmentDone]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  caption: { ...type.caption, color: colors.inkMuted },
  name: { color: colors.ink, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  bar: { flexDirection: "row", gap: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: radius.full, backgroundColor: colors.border },
  segmentDone: { backgroundColor: colors.accent },
});
