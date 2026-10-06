import { useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Button,
  Checkbox,
  ChipGroup,
  CityField,
  EmptyState,
  ListSkeleton,
  Screen,
  TextField,
  toast,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Store } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { useMyServiceProfile } from "@/hooks/use-my-service-profile";
import { useServiceTypes } from "@/hooks/use-service-types";
import { isApiMode } from "@/lib/api/config";
import { apiSubmitServiceVerification } from "@/lib/api/services/services";
import { colors, radius, spacing, type } from "@/theme/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field =
  | "firmName"
  | "ownerName"
  | "serviceType"
  | "city"
  | "address"
  | "email"
  | "mobile"
  | "description";

export default function RegisterServiceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { registerServiceProfile, userName, userEmail, profile: me, selectedCity } = useApp();
  const existing = useMyServiceProfile();
  const { types, isLoading: typesLoading } = useServiceTypes();

  const [form, setForm] = useState({
    firmName: "",
    ownerName: userName ?? "",
    city: selectedCity === "All India" ? "" : selectedCity,
    address: "",
    email: userEmail ?? "",
    mobile: me?.phone ?? "",
    description: "",
    offerings: "",
    registrationId: "",
  });
  const [typeName, setTypeName] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  if (existing.isLoading) {
    return (
      <Screen title="List your business" fallbackHref="/(tabs)/services">
        <ListSkeleton rows={5} />
      </Screen>
    );
  }

  if (existing.profile) {
    return (
      <Screen title="List your business" fallbackHref="/(tabs)/services">
        <EmptyState
          icon={Store}
          title="You already have a service profile"
          message={`${existing.profile.firmName} is listed. Manage details, verification and bookings from one place.`}
          actionLabel="Manage profile"
          onAction={() => router.replace("/services/manage" as Href)}
        />
      </Screen>
    );
  }

  const submit = async () => {
    const e: Partial<Record<Field, string>> = {};
    if (form.firmName.trim().length < 2) e.firmName = "Enter your business name.";
    if (form.ownerName.trim().length < 2) e.ownerName = "Enter the owner's name.";
    if (!typeName) e.serviceType = "Choose what you offer.";
    if (!form.city) e.city = "Choose your city.";
    if (!form.address.trim()) e.address = "Enter your business address.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email.";
    if (form.mobile.trim().length < 5) e.mobile = "Enter a phone number.";
    if (!form.description.trim()) e.description = "Describe your work.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const selected = types.find((t) => t.name === typeName);
    setBusy(true);
    const result = await registerServiceProfile({
      firmName: form.firmName.trim(),
      ownerName: form.ownerName.trim(),
      category: typeName!,
      serviceTypeId: isApiMode ? selected?.id : undefined,
      city: form.city,
      address: form.address.trim(),
      email: form.email.trim(),
      website: "",
      mobile: form.mobile.trim(),
      description: form.description.trim(),
      servicesOffered: form.offerings
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      verificationStatus: "unverified",
    });
    if (!result.ok) {
      setBusy(false);
      appAlert("Couldn't create profile", result.message);
      return;
    }
    if (isApiMode) {
      try {
        await apiSubmitServiceVerification({
          businessRegistrationId: form.registrationId.trim() || null,
          ownerNotes: "Submitted with service registration",
        });
      } catch {
        // The profile exists; verification can be resubmitted from Manage.
      }
    }
    setBusy(false);
    void queryClient.invalidateQueries({ queryKey: ["dealers", "mine"] });
    toast("Service profile created", "success");
    router.replace("/services/manage" as Href);
  };

  return (
    <Screen
      title="List your business"
      subtitle="Reach people moving to your city"
      fallbackHref="/(tabs)/services"
      footer={
        <Button
          label="Create service profile"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!agreed}
          onPress={() => void submit()}
        />
      }
    >
      <View style={styles.note}>
        <Text style={styles.noteText}>
          Your profile is visible right away. Add your business registration or GST ID and our team
          will review it for the verified badge.
        </Text>
      </View>

      <TextField label="Business name" required value={form.firmName} onChangeText={set("firmName")} error={errors.firmName} />
      <TextField label="Owner's full name" required value={form.ownerName} onChangeText={set("ownerName")} error={errors.ownerName} />

      <View style={styles.field}>
        <Text style={styles.label}>
          What do you offer? <Text style={styles.required}>*</Text>
        </Text>
        {typesLoading ? (
          <ListSkeleton rows={1} />
        ) : types.length ? (
          <ChipGroup
            options={types.map((t) => t.name)}
            value={typeName}
            onChange={(v) => {
              setTypeName(v);
              setErrors((e) => ({ ...e, serviceType: undefined }));
            }}
          />
        ) : (
          <Text style={styles.muted}>Service categories aren&apos;t available right now. Try again later.</Text>
        )}
        {errors.serviceType ? <Text style={styles.error}>{errors.serviceType}</Text> : null}
      </View>

      <CityField required value={form.city} onChange={(c) => set("city")(c)} error={errors.city} />
      <TextField label="Business address" required value={form.address} onChangeText={set("address")} error={errors.address} />
      <TextField
        label="Email"
        required
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={set("email")}
        error={errors.email}
      />
      <TextField
        label="Mobile"
        required
        keyboardType="phone-pad"
        value={form.mobile}
        onChangeText={set("mobile")}
        error={errors.mobile}
      />
      <TextField
        label="About your work"
        required
        multiline
        maxLength={5000}
        value={form.description}
        onChangeText={set("description")}
        error={errors.description}
      />
      <TextField
        label="Services offered"
        hint="Separate with commas, e.g. Modular kitchen, Full home interiors"
        value={form.offerings}
        onChangeText={set("offerings")}
      />
      <TextField
        label="Business registration or GST ID"
        autoCapitalize="characters"
        value={form.registrationId}
        onChangeText={set("registrationId")}
      />
      <Checkbox
        label="I confirm these details are accurate and agree to SqftGo verification."
        checked={agreed}
        onChange={setAgreed}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.infoSoft },
  noteText: { ...type.body, color: colors.inkSecondary },
  field: { gap: spacing.sm },
  label: { ...type.label, color: colors.inkSecondary },
  required: { color: colors.danger },
  muted: { ...type.body, color: colors.inkMuted },
  error: { ...type.caption, color: colors.danger },
});
