import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Calendar, Clock } from "@/components/ui/icons";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

/** Native date + time selection; value is a JS Date, never in the past. */
export function DateTimeField({
  label,
  value,
  onChange,
  minimumDate = new Date(),
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  minimumDate?: Date;
}) {
  const [mode, setMode] = useState<"date" | "time" | null>(null);

  const handle = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS !== "ios") setMode(null);
    if (event.type !== "set" || !picked) return;
    const next = new Date(value);
    if (mode === "date") {
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    } else {
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    }
    onChange(next < minimumDate ? minimumDate : next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setMode(mode === "date" ? null : "date")}
          style={[styles.field, mode === "date" && styles.fieldActive]}
          accessibilityRole="button"
          accessibilityLabel={`Date, ${value.toDateString()}`}
        >
          <Calendar size={18} color={colors.inkMuted} />
          <Text style={styles.value}>
            {value.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode(mode === "time" ? null : "time")}
          style={[styles.field, mode === "time" && styles.fieldActive]}
          accessibilityRole="button"
          accessibilityLabel={`Time, ${value.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`}
        >
          <Clock size={18} color={colors.inkMuted} />
          <Text style={styles.value}>
            {value.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
          </Text>
        </Pressable>
      </View>
      {mode ? (
        <DateTimePicker
          value={value}
          mode={mode}
          minimumDate={mode === "date" ? minimumDate : undefined}
          minuteInterval={15}
          display={Platform.OS === "ios" ? (mode === "date" ? "inline" : "spinner") : "default"}
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
  row: { flexDirection: "row", gap: spacing.sm },
  field: {
    flex: 1,
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
  value: { ...type.body, color: colors.ink },
});
