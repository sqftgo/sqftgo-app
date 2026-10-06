import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Check } from "@/components/ui/icons";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

/** Selectable pill for single or multi choice (filters, amenities, property type). */
export function Chip({
  label,
  selected,
  onPress,
  showCheck,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Show a check mark when selected (multi-select lists). */
  showCheck?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {showCheck && selected ? <Check size={14} color={colors.accent} /> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  labelFor,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (next: T) => void;
  labelFor?: (option: T) => string;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Chip key={o} label={labelFor ? labelFor(o) : o} selected={value === o} onPress={() => onChange(o)} />
      ))}
    </View>
  );
}

export function MultiChipGroup({
  options,
  value,
  onChange,
  max,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const toggle = (o: string) => {
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  };
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip key={o} label={o} selected={value.includes(o)} onPress={() => toggle(o)} showCheck />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: touchTarget - 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  pressed: { opacity: 0.8 },
  label: { ...type.label, color: colors.inkSecondary },
  labelSelected: { color: colors.ink },
});
