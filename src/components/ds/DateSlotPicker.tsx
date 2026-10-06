import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Calendar } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

/** Matches web VisitBookingForm TIME_SLOTS (10 AM – 5 PM, no 1 PM). */
export const VISIT_TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
] as const;

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function slotHour(slot: string): number {
  const [time, meridiem] = slot.split(" ");
  let h = Number(time.split(":")[0]);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h;
}

/** True when a slot on `date` has already started. */
export function isSlotPast(date: string, slot: string): boolean {
  const now = new Date();
  if (date !== toIsoDate(now)) return false;
  return slotHour(slot) <= now.getHours();
}

export function tomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toIsoDate(d);
}

const DAY_COUNT = 14;

export function DateSlotPicker({
  date,
  time,
  onChangeDate,
  onChangeTime,
}: {
  date: string;
  time: string;
  onChangeDate: (iso: string) => void;
  onChangeTime: (slot: string) => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const days = useMemo(() => {
    const out: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < DAY_COUNT; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);
  const inStrip = days.some((d) => toIsoDate(d) === date);

  const select = (iso: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onChangeDate(iso);
    if (isSlotPast(iso, time)) {
      const next = VISIT_TIME_SLOTS.find((s) => !isSlotPast(iso, s));
      if (next) onChangeTime(next);
    }
  };

  const onCalendar = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS !== "ios") setShowCalendar(false);
    if (event.type === "set" && value) select(toIsoDate(value));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Date</Text>
        <Pressable
          onPress={() => setShowCalendar((s) => !s)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Pick another date"
          style={styles.moreBtn}
        >
          <Calendar size={16} color={colors.accent} />
          <Text style={styles.moreText}>{inStrip ? "More dates" : fromIsoDate(date).toDateString()}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {days.map((d, i) => {
          const iso = toIsoDate(d);
          const active = iso === date;
          const weekday = i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" });
          return (
            <Pressable
              key={iso}
              onPress={() => select(iso)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={d.toDateString()}
              style={[styles.day, active && styles.dayActive]}
            >
              <Text style={[styles.dayWeek, active && styles.onActive]}>{weekday}</Text>
              <Text style={[styles.dayNum, active && styles.onActive]}>{d.getDate()}</Text>
              <Text style={[styles.dayWeek, active && styles.onActive]}>
                {d.toLocaleDateString("en-IN", { month: "short" })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showCalendar ? (
        <DateTimePicker
          value={fromIsoDate(date)}
          mode="date"
          minimumDate={days[0]}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onCalendar}
          accentColor={colors.accent}
        />
      ) : null}

      <Text style={styles.label}>Time</Text>
      <View style={styles.slots}>
        {VISIT_TIME_SLOTS.map((slot) => {
          const active = slot === time;
          const past = isSlotPast(date, slot);
          return (
            <Pressable
              key={slot}
              disabled={past}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
                onChangeTime(slot);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: past }}
              style={[styles.slot, active && styles.slotActive, past && { opacity: 0.35 }]}
            >
              <Text style={[styles.slotText, active && styles.onActive]}>{slot}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { ...type.label, color: colors.inkSecondary },
  moreBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  moreText: { ...type.label, color: colors.accent },
  strip: { gap: spacing.sm, paddingRight: spacing.lg },
  day: {
    width: 64,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    gap: 2,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayWeek: { ...type.micro, color: colors.inkMuted },
  dayNum: { ...type.title, color: colors.ink },
  onActive: { color: colors.onAccent },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: {
    minWidth: 96,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  slotText: { ...type.label, color: colors.ink },
});
