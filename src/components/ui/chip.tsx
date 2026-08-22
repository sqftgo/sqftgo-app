import React from "react";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Check, X } from "@/components/ui/icons";

import { colors, radius, spacing, type } from "@/theme/tokens";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Show a leading check mark when selected */
  showCheck?: boolean;
  /** Optional trailing count or badge string */
  badge?: string | number;
}

/** Selectable pill used for categories, quick filters, and filter options. */
export function Chip({
  label,
  selected = false,
  onPress,
  showCheck = false,
  badge,
}: ChipProps) {
  const handlePress = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
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
      {badge !== undefined && (
        <View
          style={{
            backgroundColor: selected ? colors.accent : colors.surfaceSubtle,
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: radius.md,
          }}
        >
          <Text
            style={{
              ...type.micro,
              color: selected ? colors.onAccent : colors.inkMuted,
              fontWeight: "700",
            }}
          >
            {badge}
          </Text>
        </View>
      )}
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

interface MultiSelectChipRowProps<T extends string | number> {
  options: { value: T; label: string }[];
  values: T[];
  onToggle: (value: T) => void;
  showCheck?: boolean;
}

/** A wrapping row of multi-select toggleable chips (e.g. BHK, Furnishing, Amenities). */
export function MultiSelectChipRow<T extends string | number>({
  options,
  values,
  onToggle,
  showCheck = false,
}: MultiSelectChipRowProps<T>) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {options.map((opt) => {
        const isSelected = values.includes(opt.value);
        return (
          <Chip
            key={String(opt.value)}
            label={opt.label}
            selected={isSelected}
            showCheck={showCheck}
            onPress={() => onToggle(opt.value)}
          />
        );
      })}
    </View>
  );
}

interface RemovableFilterChipProps {
  label: string;
  onRemove: () => void;
}

/** Individual removable filter chip shown under the search bar */
export function RemovableFilterChip({ label, onRemove }: RemovableFilterChipProps) {
  const handleRemove = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    onRemove();
  };

  return (
    <Pressable
      onPress={handleRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label} filter`}
      hitSlop={4}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.accentBorder,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ ...type.label, color: colors.accent, fontWeight: "600" }}>{label}</Text>
      <X size={12} color={colors.accent} strokeWidth={2.5} />
    </Pressable>
  );
}

