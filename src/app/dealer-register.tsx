import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, ChipGroup, CityField, ListRow, ListSection, Screen, TextField } from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Briefcase, Clock } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { DirectoryCategory } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

const DEALER_CATEGORIES = ["Agent & Broker", "Builder & Developer", "Property Consultant"] as const satisfies readonly DirectoryCategory[];
type DealerCategory = (typeof DEALER_CATEGORIES)[number];

export default function DealerRegisterScreen() {
  const router = useRouter();
  const { registerAsDealer, userEmail, userName, dealerAccess, userRole, selectedCity } = useApp();

  const [firmName, setFirmName] = useState("");
  const [ownerName, setOwnerName] = useState(userName);
  const [category, setCategory] = useState<DealerCategory>("Agent & Broker");
  const [city, setCity] = useState(selectedCity && selectedCity.toLowerCase() !== "all india" ? selectedCity : "");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [reraId, setReraId] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  if (userRole === "broker" || dealerAccess === "approved") {
    return (
      <Screen title="Become a dealer">
        <Text style={styles.body}>Your dealer account is already active.</Text>
        <Button label="Open dashboard" onPress={() => router.replace("/(dealer)" as Href)} fullWidth />
      </Screen>
    );
  }

  if (dealerAccess === "pending") {
    return (
      <Screen title="Become a dealer">
        <View style={styles.notice}>
          <Clock size={24} color={colors.warning} />
          <Text style={styles.noticeTitle}>Application in review</Text>
          <Text style={styles.body}>We&apos;ll unlock your dealer dashboard as soon as the SqftGo team approves it.</Text>
        </View>
        <Button label="View status" onPress={() => router.replace("/dealer-pending" as Href)} fullWidth />
      </Screen>
    );
  }

  const errors = {
    firmName: !firmName.trim() ? "Enter your firm name" : null,
    ownerName: !ownerName.trim() ? "Enter the owner's name" : null,
    city: !city.trim() ? "Choose a city" : null,
    address: !address.trim() ? "Enter your office address" : null,
    mobile: mobile.replace(/\D/g, "").length < 10 ? "Enter a 10-digit mobile number" : null,
  };
  const show = (e: string | null) => (touched ? e : null);

  const handleSubmit = async () => {
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    const result = await registerAsDealer({
      firmName: firmName.trim(),
      ownerName: ownerName.trim(),
      category,
      city,
      address: address.trim(),
      email: userEmail,
      website: website.trim() || "—",
      mobile: mobile.trim(),
      description: description.trim() || `${firmName.trim()} on SqftGo`,
      reraId: reraId.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      appAlert("Couldn't submit", result.message ?? "Please try again.");
      return;
    }
    router.replace("/dealer-pending" as Href);
  };

  return (
    <Screen
      title="Become a dealer"
      footer={<Button label="Submit for review" onPress={() => void handleSubmit()} loading={busy} fullWidth />}
    >
      <Text style={styles.body}>
        Tell us about your business. The SqftGo team reviews every dealer before listing tools unlock, usually within
        a few working days.
      </Text>

      <View style={styles.group}>
        <Text style={styles.label}>Business type</Text>
        <ChipGroup options={DEALER_CATEGORIES} value={category} onChange={setCategory} />
      </View>

      <View style={styles.group}>
        <TextField label="Firm name" required value={firmName} onChangeText={setFirmName} placeholder="e.g. Lakeside Realty" error={show(errors.firmName)} />
        <TextField label="Owner name" required value={ownerName} onChangeText={setOwnerName} autoComplete="name" error={show(errors.ownerName)} />
        <TextField
          label="Mobile"
          required
          value={mobile}
          onChangeText={setMobile}
          placeholder="98xxxxxxxx"
          keyboardType="phone-pad"
          autoComplete="tel"
          prefix="+91"
          error={show(errors.mobile)}
        />
      </View>

      <View style={styles.group}>
        <CityField value={city} onChange={(c) => setCity(c)} required />
        {show(errors.city) ? <Text style={styles.error}>{errors.city}</Text> : null}
        <TextField label="Office address" required value={address} onChangeText={setAddress} error={show(errors.address)} />
      </View>

      <View style={styles.group}>
        <TextField label="RERA ID" value={reraId} onChangeText={setReraId} hint="Optional. Shown on your profile when provided." />
        <TextField label="Website" value={website} onChangeText={setWebsite} placeholder="https://" autoCapitalize="none" keyboardType="url" />
        <TextField
          label="About your firm"
          value={description}
          onChangeText={setDescription}
          placeholder="What you specialise in, areas you cover"
          multiline
        />
      </View>

      <ListSection>
        <ListRow
          icon={Briefcase}
          title="Run a service business?"
          subtitle="Interiors, movers, architects and other trades list here instead"
          onPress={() => router.push("/services/register" as Href)}
        />
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body, color: colors.inkSecondary },
  group: { gap: spacing.md },
  label: { ...type.label, color: colors.inkSecondary },
  error: { ...type.caption, color: colors.danger },
  notice: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  noticeTitle: { ...type.heading, color: colors.ink },
});
