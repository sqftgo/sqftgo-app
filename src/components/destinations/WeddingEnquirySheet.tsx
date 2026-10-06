import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, TextField } from "@/components/ds";
import { CheckCircle2 } from "@/components/ui/icons";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import type { WeddingProperty, WeddingVenue } from "@/data/wedding-venues";
import { isApiMode } from "@/lib/api/config";
import { apiCreateEnquiry } from "@/lib/api/services/enquiries";
import { colors, radius, spacing, type } from "@/theme/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WeddingItem =
  | { kind: "venue"; item: WeddingVenue }
  | { kind: "property"; item: WeddingProperty };

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

/** Venue / wedding-property enquiry, same payload as the web WeddingInquiryModal. */
export function WeddingEnquirySheet({
  target,
  destination,
  onClose,
}: {
  target: WeddingItem | null;
  destination: string;
  onClose: () => void;
}) {
  const { userName, userEmail, profile } = useApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const send = useMutation({
    mutationFn: (t: WeddingItem) => {
      const isVenue = t.kind === "venue";
      const itemName = isVenue ? t.item.name : t.item.title;
      const subtype = isVenue ? t.item.type : t.item.propertyType;
      return apiCreateEnquiry({
        name: name.trim(),
        email: email.trim(),
        mobile: phone.trim(),
        city: destination,
        propertyType: isVenue ? "Wedding Venue" : "Wedding Property",
        budget: isVenue ? t.item.pricePerEvent : t.item.price,
        remarks: `Inquiry for: ${itemName} (${subtype}) in ${destination}`,
        message: notes.trim() || undefined,
        payload: {
          itemId: t.item.id,
          itemName,
          itemType: t.kind,
          destinationName: destination,
          eventDate: eventDate.trim() || null,
          guestCount: guests.trim() || null,
        },
      });
    },
  });

  useEffect(() => {
    if (!target) return;
    setName((v) => v || userName || "");
    setEmail((v) => v || userEmail || "");
    setPhone((v) => v || profile?.phone || "");
  }, [target, userName, userEmail, profile?.phone]);

  const close = () => {
    onClose();
    send.reset();
  };

  const submit = () => {
    if (!target) return;
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Enter your name.";
    if (phone.trim().length < 5) e.phone = "Enter a phone number.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email.";
    setErrors(e);
    if (Object.keys(e).length) return;
    send.mutate(target);
  };

  const title = target ? (target.kind === "venue" ? target.item.name : target.item.title) : "";
  const subtitle = target
    ? `${target.kind === "venue" ? target.item.type : target.item.propertyType} · ${destination}`
    : undefined;

  return (
    <ModalSheet visible={Boolean(target)} onClose={close} avoidKeyboard maxHeight="92%">
      <ModalSheetHeader title={send.isSuccess ? "Enquiry sent" : title} subtitle={subtitle} onClose={close} />
      {send.isSuccess ? (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={32} color={colors.success} />
          </View>
          <Text style={styles.successBody}>
            Our {destination} team will get back to you with availability, pricing and a site visit.
          </Text>
          <Button label="Done" onPress={close} fullWidth />
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          {!isApiMode ? (
            <Text style={styles.offline}>Enquiries need a connection to SqftGo servers.</Text>
          ) : null}
          <TextField label="Full name" required value={name} onChangeText={setName} autoComplete="name" error={errors.name} />
          <TextField
            label="Phone"
            required
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
          />
          <TextField
            label="Email"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <View style={styles.row}>
            <TextField
              label="Event date"
              placeholder="e.g. Dec 2026"
              value={eventDate}
              onChangeText={setEventDate}
              containerStyle={styles.cell}
            />
            <TextField
              label="Guests"
              placeholder="e.g. 300"
              keyboardType="number-pad"
              value={guests}
              onChangeText={setGuests}
              containerStyle={styles.cell}
            />
          </View>
          <TextField
            label="Requirements"
            multiline
            maxLength={5000}
            placeholder="Sangeet lawn, guest rooms, budget…"
            value={notes}
            onChangeText={setNotes}
          />
          {send.isError ? (
            <Text style={styles.error}>
              {send.error instanceof Error ? send.error.message : "Couldn't send. Please try again."}
            </Text>
          ) : null}
          <Button
            label="Send enquiry"
            size="lg"
            fullWidth
            disabled={!isApiMode}
            loading={send.isPending}
            onPress={submit}
          />
        </ScrollView>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },
  row: { flexDirection: "row", gap: spacing.md },
  cell: { flex: 1 },
  offline: {
    ...type.caption,
    color: colors.inkSecondary,
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  error: { ...type.caption, color: colors.danger },
  success: { alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successBody: { ...type.body, color: colors.inkMuted, textAlign: "center", marginBottom: spacing.sm },
});
