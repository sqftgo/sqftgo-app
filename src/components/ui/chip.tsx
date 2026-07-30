import React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { colors, radius, spacing, type } from "@/theme/tokens";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Show a leading check mark when selected */
  showCheck?: boolean;
}

/** Selectable pill used for categories, quick filters, and filter options. */
export function Chip({ label, selected = false, onPress, showCheck = false }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: selected ? colors.ink : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.ink : colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {showCheck && selected && <Check size={12} color={colors.surface} strokeWidth={3} />}
      <Text style={{ ...type.label, color: selected ? colors.surface : colors.inkSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

interface FilterOptionRowProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A wrapping row of mutually-exclusive chips for a single filter group. */
export function FilterOptionRow<T extends string | number>({
  options,
  value,
  onChange,
}: FilterOptionRowProps<T>) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {options.map((opt) => (
        <Chip
          key={String(opt.value)}
          label={opt.label}
          selected={value === opt.value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
}
