import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import {
  DateSlotPicker,
  VISIT_TIME_SLOTS,
  isSlotPast,
  toIsoDate,
  tomorrowIsoDate,
} from "@/components/ds/DateSlotPicker";
import { TextField } from "@/components/ds/TextField";
import { appAlert } from "@/components/ui/app-alert";
import { CheckCircle2, MapPin } from "@/components/ui/icons";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Digits only, then Indian mobile rules (10 digits; optional leading 91). */
function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function isValidIndianMobile(raw: string): boolean {
  const d = normalizeIndianPhone(raw);
  return /^[6-9]\d{9}$/.test(d);
}

function firstAvailableSlot(date: string): string {
  return VISIT_TIME_SLOTS.find((s) => !isSlotPast(date, s)) ?? "";
}

function defaultVisitDate(): string {
  const today = toIsoDate(new Date());
  if (firstAvailableSlot(today)) return today;
  return tomorrowIsoDate();
}

export function VisitSheet({
  property,
  visible,
  onClose,
  onViewVisits,
}: {
  property: Property;
  visible: boolean;
  onClose: () => void;
  onViewVisits?: () => void;
}) {
  const { bookVisit, userName, userEmail, profile, isLoggedIn, getLastActionError } = useApp();
  const [date, setDate] = useState(defaultVisitDate);
  const [time, setTime] = useState(() => firstAvailableSlot(defaultVisitDate()) || "11:00 AM");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "phone" | "time", string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Always reset from the signed-in profile when the sheet opens (don't keep stale empties).
  useEffect(() => {
    if (!visible) return;
    const nextDate = defaultVisitDate();
    const nextTime = firstAvailableSlot(nextDate) || "11:00 AM";
    setDate(nextDate);
    setTime(nextTime);
    setName((userName || profile?.name || "").trim());
    setEmail((userEmail || "").trim());
    setPhone((profile?.phone || "").trim());
    setNotes("");
    setErrors({});
    setSending(false);
    setSent(false);
  }, [visible, userName, userEmail, profile?.phone, profile?.name]);

  const place = useMemo(
    () => [property.locality, property.city].filter(Boolean).join(", "),
    [property.locality, property.city],
  );

  const close = () => {
    onClose();
    setSent(false);
  };

  const submit = async () => {
    const e: typeof errors = {};
    if (!time || isSlotPast(date, time)) e.time = "Pick a time slot that hasn't passed.";
    if (name.trim().length < 2) e.name = "Enter your full name.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email.";
    if (!isValidIndianMobile(phone)) {
      e.phone = "Enter a valid 10-digit Indian mobile number.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    const phoneDigits = normalizeIndianPhone(phone);
    setSending(true);
    const created = await bookVisit({
      propertyId: property.id,
      visitDate: date,
      visitTime: time,
      phone: phoneDigits,
      notes: notes.trim() || undefined,
      name: name.trim(),
      email: email.trim(),
    });
    setSending(false);
    if (!created) {
      appAlert("Couldn't book visit", getLastActionError() ?? "Please try again.");
      return;
    }
    setSent(true);
  };

  const when = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <ModalSheet visible={visible} onClose={close} avoidKeyboard maxHeight="92%">
      <ModalSheetHeader
        title={sent ? "Visit requested" : "Book a site visit"}
        subtitle={property.title}
        onClose={close}
      />
      {sent ? (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={32} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>
            {when} at {time}
          </Text>
          {place ? (
            <View style={styles.placeRow}>
              <MapPin size={14} color={colors.inkMuted} />
              <Text style={styles.placeText}>{place}</Text>
            </View>
          ) : null}
          <Text style={styles.successBody}>
            The dealer will confirm on {phone ? `+91 ${normalizeIndianPhone(phone)}` : "your phone"}.{" "}
            {isLoggedIn ? "Track status anytime in My visits." : "We'll contact you on the number you shared."}
          </Text>
          <View style={{ alignSelf: "stretch", gap: spacing.sm }}>
            {isLoggedIn && onViewVisits ? (
              <Button
                label="View my visits"
                variant="secondary"
                onPress={() => {
                  close();
                  onViewVisits();
                }}
                fullWidth
              />
            ) : null}
            <Button label="Done" onPress={close} fullWidth />
          </View>
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          {place ? (
            <View style={styles.placeBanner}>
              <MapPin size={16} color={colors.accent} />
              <Text style={styles.placeBannerText}>{place}</Text>
            </View>
          ) : null}

          <DateSlotPicker
            date={date}
            time={time}
            onChangeDate={(d) => {
              setDate(d);
              if (!time || isSlotPast(d, time)) {
                setTime(firstAvailableSlot(d));
              }
              setErrors((x) => ({ ...x, time: undefined }));
            }}
            onChangeTime={(t) => {
              setTime(t);
              setErrors((x) => ({ ...x, time: undefined }));
            }}
          />
          {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}

          <TextField
            label="Full name"
            required
            value={name}
            onChangeText={(v) => {
              setName(v);
              setErrors((x) => ({ ...x, name: undefined }));
            }}
            autoComplete="name"
            autoCapitalize="words"
            error={errors.name}
          />
          <TextField
            label="Phone"
            required
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setErrors((x) => ({ ...x, phone: undefined }));
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="10-digit mobile"
            hint="Dealer calls this number to confirm the visit."
            error={errors.phone}
          />
          <TextField
            label="Email"
            required
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((x) => ({ ...x, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoggedIn}
            hint={isLoggedIn ? "Uses your signed-in email." : undefined}
            error={errors.email}
          />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={1000}
            placeholder="Timing preferences, group size, or questions for the dealer"
          />
          <Button
            label="Request visit"
            loading={sending}
            onPress={() => void submit()}
            fullWidth
            size="lg"
          />
        </ScrollView>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },
  error: { ...type.caption, color: colors.danger, marginTop: -spacing.sm },
  placeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  placeBannerText: { ...type.label, color: colors.inkSecondary, flex: 1 },
  success: {
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { ...type.heading, color: colors.ink, textAlign: "center" },
  placeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  placeText: { ...type.caption, color: colors.inkMuted },
  successBody: {
    ...type.body,
    color: colors.inkMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
