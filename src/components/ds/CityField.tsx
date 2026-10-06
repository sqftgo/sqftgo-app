import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { ChevronDown, MapPin } from "@/components/ui/icons";
import { useCities } from "@/hooks/use-cities";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

/** Form field that picks one of the active cities from the web catalog. */
export function CityField({
  label = "City",
  value,
  onChange,
  error,
  required,
}: {
  label?: string;
  value: string;
  /** `state` comes from the catalog when known. */
  onChange: (city: string, state?: string) => void;
  error?: string | null;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { cities } = useCities();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value || "not selected"}`}
        style={[styles.select, error ? styles.selectError : null]}
      >
        <MapPin size={18} color={colors.inkMuted} />
        <Text style={[styles.value, !value && styles.placeholder]}>{value || "Choose a city"}</Text>
        <ChevronDown size={18} color={colors.inkMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CitySelectionModal
        visible={open}
        onClose={() => setOpen(false)}
        value={value}
        onSelect={(name) => onChange(name, cities.find((c) => c.name === name)?.state)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: { ...type.label, color: colors.inkSecondary },
  required: { color: colors.danger },
  select: {
    minHeight: touchTarget + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectError: { borderColor: colors.danger },
  value: { ...type.body, color: colors.ink, flex: 1 },
  placeholder: { color: colors.inkMuted },
  error: { ...type.caption, color: colors.danger },
});
