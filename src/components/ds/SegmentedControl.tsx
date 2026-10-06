import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, type } from "@/theme/tokens";

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Optional count shown after the label. */
  count?: number;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            onPress={() => {
              if (active) return;
              if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
              onChange(s.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={s.count != null ? `${s.label}, ${s.count}` : s.label}
            style={[styles.segment, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {s.label}
              {s.count != null ? ` ${s.count}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm + 2,
    borderCurve: "continuous",
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderCurve: "continuous",
    paddingHorizontal: spacing.sm,
  },
  active: { backgroundColor: colors.surface, boxShadow: "0 1px 3px rgba(28, 37, 48, 0.12)" },
  label: { ...type.label, color: colors.inkMuted },
  labelActive: { color: colors.ink, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
