import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Calendar, X } from "@/components/ui/icons";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

function parseIso(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Optional calendar date stored as `YYYY-MM-DD` (empty string when unset). */
export function DateField({
  label,
  value,
  onChange,
  hint,
  placeholder = "Not set",
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = parseIso(value);

  const handle = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS !== "ios") setOpen(false);
    if (event.type === "set" && picked) onChange(toIso(picked));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, open && styles.fieldActive]}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={styles.press}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${date ? date.toDateString() : placeholder}`}
        >
          <Calendar size={18} color={colors.inkMuted} />
          <Text style={[styles.value, !date && { color: colors.placeholder }]}>
            {date ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : placeholder}
          </Text>
        </Pressable>
        {date ? (
          <Pressable
            onPress={() => {
              onChange("");
              setOpen(false);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
          >
            <X size={16} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {open ? (
        <DateTimePicker
          value={date ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handle}
          accentColor={colors.accent}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: { ...type.label, color: colors.inkSecondary },
  field: {
    minHeight: touchTarget + 6,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  fieldActive: { borderColor: colors.accent },
  press: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: touchTarget },
  value: { ...type.body, color: colors.ink },
  hint: { ...type.caption, color: colors.inkMuted },
});
