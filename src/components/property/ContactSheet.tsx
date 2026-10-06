import React, { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { TextField } from "@/components/ds/TextField";
import { appAlert } from "@/components/ui/app-alert";
import { Chip } from "@/components/ui/chip";
import { CheckCircle2, MessageSquare, Phone } from "@/components/ui/icons";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

const DEFAULT_MESSAGE =
  "Hi, I am interested in this property and would like to receive more details. Please contact me.";

const PRESETS = [
  { id: "visit", label: "Site visit", text: "Hi, I would like to schedule a physical site visit for this property. What time works best?" },
  { id: "price", label: "Is price negotiable?", text: "Hi, I am interested in this property. Is the asking price negotiable?" },
  { id: "video", label: "Video tour", text: "Hi, could you please share a video walkthrough or recent photos of the property?" },
  { id: "docs", label: "Deed & RERA docs", text: "Hi, could you share the title deed status and RERA verification documents for this property?" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digits(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function callOwner(phone: string) {
  Linking.openURL(`tel:${digits(phone)}`).catch(() => appAlert("Can't place call", "Your device can't open the dialer."));
}

export function whatsappOwner(phone: string, property: Property) {
  const text = encodeURIComponent(
    `Namaste, I'm interested in your property "${property.title}" in ${property.locality}, ${property.city}.`,
  );
  const number = digits(phone).replace(/^\+/, "");
  Linking.openURL(`whatsapp://send?phone=${number}&text=${text}`).catch(() =>
    Linking.openURL(`https://wa.me/${number}?text=${text}`).catch(() =>
      appAlert("Can't open WhatsApp", "Install WhatsApp or call the owner instead."),
    ),
  );
}

export function ContactSheet({
  property,
  visible,
  onClose,
  onViewInquiries,
}: {
  property: Property;
  visible: boolean;
  onClose: () => void;
  onViewInquiries?: () => void;
}) {
  const { submitInquiry, userName, userEmail, profile, isLoggedIn, getLastActionError } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [preset, setPreset] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "phone" | "message", string>>>({});
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
    if (name.trim().length < 2) e.name = "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email.";
    if (phone.trim().length < 5) e.phone = "Enter a phone number.";
    if (!message.trim()) e.message = "Write a short message.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSending(true);
    const created = await submitInquiry({
      propertyId: property.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (!created) {
      appAlert("Couldn't send inquiry", getLastActionError() ?? "Please try again.");
      return;
    }
    setSent(true);
  };

  const hasPhone = Boolean(property.ownerPhone?.trim());

  return (
    <ModalSheet visible={visible} onClose={close} avoidKeyboard maxHeight="92%">
      <ModalSheetHeader title={sent ? "Inquiry sent" : "Contact owner"} subtitle={property.title} onClose={close} />
      {sent ? (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={32} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Message sent to {property.ownerName}</Text>
          <Text style={styles.successBody}>They&apos;ll get back to you on {phone || email}.</Text>
          <View style={{ alignSelf: "stretch", gap: spacing.sm }}>
            {isLoggedIn && onViewInquiries ? (
              <Button
                label="View my inquiries"
                variant="secondary"
                onPress={() => {
                  close();
                  onViewInquiries();
                }}
                fullWidth
              />
            ) : null}
            <Button label="Done" onPress={close} fullWidth />
          </View>
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          {hasPhone ? (
            <View style={styles.quickRow}>
              <Button label="Call" icon={Phone} variant="secondary" onPress={() => callOwner(property.ownerPhone)} style={{ flex: 1 }} />
              <Button
                label="WhatsApp"
                icon={MessageSquare}
                variant="secondary"
                onPress={() => whatsappOwner(property.ownerPhone, property)}
                style={{ flex: 1 }}
              />
            </View>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <Text style={styles.label}>Quick message</Text>
            <View style={styles.chips}>
              {PRESETS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  selected={preset === p.id}
                  onPress={() => {
                    setPreset(p.id);
                    setMessage(p.text);
                  }}
                />
              ))}
            </View>
          </View>

          <TextField
            label="Message"
            required
            value={message}
            onChangeText={(v) => {
              setMessage(v);
              setPreset(null);
            }}
            multiline
            maxLength={2000}
            error={errors.message}
          />
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

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Never pay a token amount before visiting the property and checking its documents.
            </Text>
          </View>

          <Button label="Send inquiry" loading={sending} onPress={() => void submit()} fullWidth size="lg" />
        </ScrollView>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  label: { ...type.label, color: colors.inkSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  notice: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  noticeText: { ...type.caption, color: colors.ink },
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
