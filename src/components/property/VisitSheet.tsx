import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { DateSlotPicker, isSlotPast, tomorrowIsoDate } from "@/components/ds/DateSlotPicker";
import { TextField } from "@/components/ds/TextField";
import { appAlert } from "@/components/ui/app-alert";
import { CheckCircle2 } from "@/components/ui/icons";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [date, setDate] = useState(tomorrowIsoDate());
  const [time, setTime] = useState("11:00 AM");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "phone" | "time", string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName((v) => v || userName);
    setEmail((v) => v || userEmail);
    setPhone((v) => v || profile?.phone || "");
  }, [visible, userName, userEmail, profile?.phone]);

  const close = () => {
    onClose();
    setSent(false);
  };

  const submit = async () => {
    const e: typeof errors = {};
    if (!time || isSlotPast(date, time)) e.time = "Pick a time slot that hasn't passed.";
    if (name.trim().length < 2) e.name = "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email.";
    if (phone.trim().length < 5) e.phone = "Enter a phone number.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSending(true);
    const created = await bookVisit({
      propertyId: property.id,
      visitDate: date,
      visitTime: time,
      phone: phone.trim(),
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

  const when = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <ModalSheet visible={visible} onClose={close} avoidKeyboard maxHeight="92%">
      <ModalSheetHeader title={sent ? "Visit requested" : "Book a site visit"} subtitle={property.title} onClose={close} />
      {sent ? (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={32} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>
            {when} at {time}
          </Text>
          <Text style={styles.successBody}>
            The dealer will confirm your visit. {isLoggedIn ? "Track it in My visits." : "We'll contact you on the number you shared."}
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
          <DateSlotPicker
            date={date}
            time={time}
            onChangeDate={(d) => {
              setDate(d);
              if (isSlotPast(d, time)) setTime("");
            }}
            onChangeTime={(t) => {
              setTime(t);
              setErrors((x) => ({ ...x, time: undefined }));
            }}
          />
          {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}

          <TextField label="Full name" required value={name} onChangeText={setName} autoComplete="name" error={errors.name} />
          <TextField
            label="Phone"
            required
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
          />
          <TextField
            label="Email"
            required
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoggedIn}
            error={errors.email}
          />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={1000}
            placeholder="Timing preferences or group size"
          />
          <Button label="Request visit" loading={sending} onPress={() => void submit()} fullWidth size="lg" />
        </ScrollView>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },
  error: { ...type.caption, color: colors.danger, marginTop: -spacing.sm },
  success: { alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { ...type.heading, color: colors.ink, textAlign: "center" },
  successBody: { ...type.body, color: colors.inkMuted, textAlign: "center", marginBottom: spacing.sm },
});
