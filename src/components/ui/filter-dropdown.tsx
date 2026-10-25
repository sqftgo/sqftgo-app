import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Check, ChevronDown } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

export type FilterDropdownOption<T extends string = string> = {
  value: T;
  label: string;
};

interface FilterDropdownProps<T extends string = string> {
  label: string;
  value: T;
  options: FilterDropdownOption<T>[];
  onChange: (value: T) => void;
  /** Shown when the current value is not in options. */
  placeholder?: string;
  /** Close other open dropdowns in a group by syncing this key. */
  openKey?: string | null;
  onOpenKeyChange?: (key: string | null) => void;
  fieldKey?: string;
}

/**
 * Single-select dropdown for filter panels.
 * Expands inline (no nested modal) so it works reliably inside FilterSheet.
 */
export function FilterDropdown<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  openKey,
  onOpenKeyChange,
  fieldKey,
}: FilterDropdownProps<T>) {
  const [localOpen, setLocalOpen] = useState(false);
  const key = fieldKey ?? label;
  const open = openKey != null ? openKey === key : localOpen;

  useEffect(() => {
    if (openKey != null && openKey !== key) setLocalOpen(false);
  }, [openKey, key]);

  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? placeholder;

  const setOpen = (next: boolean) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    if (onOpenKeyChange) onOpenKeyChange(next ? key : null);
    else setLocalOpen(next);
  };

  const pick = (next: T) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    onChange(next);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${label}, ${display}`}
        style={({ pressed }) => [styles.trigger, open && styles.triggerOpen, pressed && { opacity: 0.9 }]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {display}
        </Text>
        <ChevronDown
          size={16}
          color={colors.inkMuted}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={styles.menuScroll}
            showsVerticalScrollIndicator
          >
            {options.map((opt, index) => {
              const active = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => pick(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && styles.optionBorder,
                    active && styles.optionActive,
                    pressed && { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Text
                    style={[styles.optionLabel, active && styles.optionLabelActive]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                  {active ? <Check size={16} color={colors.accent} strokeWidth={2.4} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: { ...type.caption, color: colors.inkMuted },
  trigger: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerOpen: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  value: { ...type.body, color: colors.ink, flex: 1 },
  placeholder: { color: colors.inkMuted },
  menu: {
    borderRadius: radius.sm,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  menuScroll: { maxHeight: 200 },
  option: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  optionActive: { backgroundColor: colors.accentSoft },
  optionLabel: { ...type.body, color: colors.ink, flex: 1 },
  optionLabelActive: {
    color: colors.accent,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});
