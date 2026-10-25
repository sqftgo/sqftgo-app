import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import {
  Button,
  ChipGroup,
  CityField,
  EmptyState,
  ListRow,
  ListSection,
  MultiChipGroup,
  Screen,
  TextField,
  toast,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Camera, Eye, Plus, Store } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { DirectoryCategory } from "@/data/types";
import { initialsFromName } from "@/lib/format";
import { pickAndUploadPropertyImage } from "@/lib/media-upload";
import { ownsDirectory } from "@/lib/ownership";
import { colors, radius, spacing, type } from "@/theme/tokens";

const DEALER_CATEGORIES = [
  "Agent & Broker",
  "Builder & Developer",
  "Property Consultant",
] as const satisfies readonly DirectoryCategory[];
type DealerCategory = (typeof DEALER_CATEGORIES)[number];

const SPECIALTIES = [
  "Residential sales",
  "Residential rentals",
  "Commercial leases",
  "Plots & land",
  "Luxury homes",
  "New projects",
  "RERA clearances",
  "Title checks",
  "Resale",
  "Investment advisory",
];

type Errors = Partial<Record<"firmName" | "ownerName" | "mobile" | "email" | "city", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asDealerCategory(value: string | undefined): DealerCategory {
  if (value && (DEALER_CATEGORIES as readonly string[]).includes(value)) {
    return value as DealerCategory;
  }
  return "Agent & Broker";
}

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { profile, userEmail, userName, directoryProfiles, updateDirectoryProfile, isApiMode } = useApp();

  const mine = useMemo(() => {
    if (profile?.directoryProfileId) {
      const byId = directoryProfiles.find((d) => d.id === profile.directoryProfileId);
      if (byId) return byId;
    }
    return directoryProfiles.find((d) => ownsDirectory(d, { userId: profile?.id, email: userEmail }));
  }, [directoryProfiles, profile, userEmail]);

  const [form, setForm] = useState(() => ({
    firmName: mine?.firmName ?? "",
    ownerName: mine?.ownerName ?? userName,
    category: asDealerCategory(mine?.category),
    city: mine?.city ?? "",
    address: mine?.address ?? "",
    mobile: mine?.mobile ?? profile?.phone ?? "",
    email: mine?.email ?? userEmail,
    reraId: mine?.reraId ?? "",
    experience: mine?.experience ?? "",
    teamSize: mine?.teamSize != null ? String(mine.teamSize) : "",
    description: mine?.description ?? "",
    specialties: mine?.specialties ?? [],
    logoUrl: mine?.logoUrl ?? mine?.avatarUrl ?? "",
    coverImageUrl: mine?.coverImageUrl ?? mine?.coverUrl ?? "",
    hoursWeekdays: mine?.businessHours?.weekdays ?? "",
    hoursSaturday: mine?.businessHours?.saturday ?? "",
    hoursSunday: mine?.businessHours?.sunday ?? "",
    listingActive: mine?.listingActive ?? true,
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  if (!mine) {
    return (
      <Screen title="Business profile" fallbackHref={"/(tabs)/profile" as Href}>
        <EmptyState
          icon={Store}
          title="No business profile yet"
          message="Register as a dealer to create your public directory card."
          actionLabel="Register as dealer"
          onAction={() => router.replace("/dealer-register" as Href)}
        />
      </Screen>
    );
  }

  const upload = async (which: "logo" | "cover") => {
    if (!isApiMode) {
      appAlert("Photo upload unavailable", "Connect to the API to change your logo and cover.");
      return;
    }
    setUploading(which);
    try {
      const url = await pickAndUploadPropertyImage();
      if (url) set(which === "logo" ? "logoUrl" : "coverImageUrl", url);
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    const digits = form.mobile.replace(/\D/g, "");
    const e: Errors = {};
    if (form.firmName.trim().length < 2) e.firmName = "Enter your firm name.";
    if (form.ownerName.trim().length < 2) e.ownerName = "Enter the owner or representative name.";
    if (digits.length < 10) e.mobile = "Enter a 10-digit mobile number.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email.";
    if (form.city.trim().length < 2) e.city = "Choose your operating city.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const teamSize = form.teamSize.trim() ? Number.parseInt(form.teamSize, 10) : null;
    const hours = {
      weekdays: form.hoursWeekdays.trim(),
      saturday: form.hoursSaturday.trim(),
      sunday: form.hoursSunday.trim(),
    };
    const hasHours = Object.values(hours).some(Boolean);

    setSaving(true);
    const result = await updateDirectoryProfile(mine.id, {
      firmName: form.firmName.trim(),
      ownerName: form.ownerName.trim(),
      category: form.category,
      city: form.city.trim(),
      address: form.address.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      reraId: form.reraId.trim() || undefined,
      experience: form.experience.trim() || undefined,
      teamSize: teamSize != null && Number.isFinite(teamSize) ? teamSize : undefined,
      description: form.description.trim(),
      specialties: form.specialties,
      logoUrl: form.logoUrl || null,
      coverImageUrl: form.coverImageUrl || null,
      avatarUrl: form.logoUrl || undefined,
      coverUrl: form.coverImageUrl || undefined,
      businessHours: hasHours ? hours : null,
      listingActive: form.listingActive,
    });
    setSaving(false);
    if (!result.ok) {
      appAlert("Couldn't save", result.message ?? "Please try again.");
      return;
    }
    toast("Business profile saved");
  };

  const busy = Boolean(uploading) || saving;

  return (
    <Screen
      title="Business profile"
      fallbackHref={"/(tabs)/profile" as Href}
      rightAction={
        <Button
          label="Preview"
          variant="tertiary"
          icon={Eye}
          onPress={() => router.push({ pathname: "/broker/[id]", params: { id: mine.id } })}
        />
      }
      footer={
        <Button
          label="Save business profile"
          loading={saving}
          disabled={Boolean(uploading)}
          onPress={() => void save()}
          fullWidth
        />
      }
    >
      <View style={styles.brand}>
        <Pressable
          onPress={() => void upload("cover")}
          disabled={busy}
          style={({ pressed }) => [styles.cover, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel="Change cover photo"
        >
          {form.coverImageUrl ? (
            <Image source={{ uri: form.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.coverEmpty}>
              <Plus size={18} color={colors.onPrimary} />
              <Text style={styles.coverText}>Add cover photo</Text>
            </View>
          )}
          {uploading === "cover" ? (
            <View style={styles.overlay}>
              <ActivityIndicator color={colors.onAccent} />
            </View>
          ) : form.coverImageUrl ? (
            <View style={styles.coverBadge}>
              <Camera size={14} color={colors.onPrimary} />
              <Text style={styles.coverBadgeText}>Cover</Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.brandRow}>
          <Pressable
            onPress={() => void upload("logo")}
            disabled={busy}
            style={({ pressed }) => [styles.logo, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Change logo"
          >
            {form.logoUrl ? (
              <Image source={{ uri: form.logoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Text style={styles.logoText}>{initialsFromName(form.firmName || form.ownerName || "SG")}</Text>
            )}
            {uploading === "logo" ? (
              <View style={styles.overlay}>
                <ActivityIndicator color={colors.onAccent} />
              </View>
            ) : null}
          </Pressable>
          <View style={styles.brandMeta}>
            <Text style={styles.firmPreview} numberOfLines={2}>
              {form.firmName.trim() || "Your firm name"}
            </Text>
            <Text style={styles.ownerPreview} numberOfLines={1}>
              {form.ownerName.trim() ? `Owner · ${form.ownerName.trim()}` : "Owner name"}
            </Text>
            <Text style={styles.caption}>Tap cover or logo to update photos.</Text>
          </View>
        </View>
      </View>

      <ListSection footer="Hidden profiles don't appear in the public dealer directory.">
        <ListRow
          title="Show in directory"
          subtitle={form.listingActive ? "Visible to buyers searching dealers" : "Hidden from the dealer directory"}
          showChevron={false}
          accessory={
            <Switch
              value={form.listingActive}
              onValueChange={(v) => set("listingActive", v)}
              trackColor={{ true: colors.accent, false: colors.borderStrong }}
            />
          }
        />
      </ListSection>

      <View style={styles.group}>
        <Text style={styles.heading}>Firm</Text>
        <TextField
          label="Firm name"
          required
          value={form.firmName}
          onChangeText={(v) => set("firmName", v)}
          maxLength={160}
          placeholder="e.g. Lakeside Realty"
          error={errors.firmName}
        />
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Business type</Text>
          <ChipGroup options={DEALER_CATEGORIES} value={form.category} onChange={(c) => set("category", c)} />
        </View>
        <CityField value={form.city} onChange={(c) => set("city", c)} required error={errors.city} />
        <TextField
          label="Office address"
          value={form.address}
          onChangeText={(v) => set("address", v)}
          maxLength={300}
          placeholder="Street, landmark, area"
        />
        <TextField
          label="RERA ID"
          value={form.reraId}
          onChangeText={(v) => set("reraId", v)}
          autoCapitalize="characters"
          maxLength={80}
          hint="Optional. Shown as a badge on your public profile."
        />
        <View style={styles.row}>
          <TextField
            label="Experience"
            value={form.experience}
            onChangeText={(v) => set("experience", v)}
            placeholder="e.g. 8 years"
            maxLength={80}
            containerStyle={{ flex: 1 }}
          />
          <TextField
            label="Team size"
            value={form.teamSize}
            onChangeText={(v) => set("teamSize", v.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={5}
            containerStyle={{ flex: 1 }}
          />
        </View>
        <TextField
          label="About the firm"
          value={form.description}
          onChangeText={(v) => set("description", v)}
          multiline
          maxLength={5000}
          placeholder="What you specialise in and the areas you cover"
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.heading}>Contact</Text>
        <TextField
          label="Owner / representative"
          required
          value={form.ownerName}
          onChangeText={(v) => set("ownerName", v)}
          maxLength={120}
          autoCapitalize="words"
          error={errors.ownerName}
        />
        <TextField
          label="Mobile"
          required
          value={form.mobile}
          onChangeText={(v) => set("mobile", v)}
          keyboardType="phone-pad"
          maxLength={40}
          prefix="+91"
          placeholder="98xxxxxxxx"
          error={errors.mobile}
        />
        <TextField
          label="Public email"
          required
          value={form.email}
          onChangeText={(v) => set("email", v)}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={200}
          hint="Shown to customers on your profile."
          error={errors.email}
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.heading}>Specialties</Text>
        <Text style={styles.caption}>Pick the work buyers should associate with your firm.</Text>
        <MultiChipGroup
          options={SPECIALTIES}
          value={form.specialties}
          onChange={(next) => set("specialties", next)}
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.heading}>Business hours</Text>
        <TextField
          label="Monday – Friday"
          value={form.hoursWeekdays}
          onChangeText={(v) => set("hoursWeekdays", v)}
          placeholder="9:30 AM – 7:30 PM"
        />
        <TextField
          label="Saturday"
          value={form.hoursSaturday}
          onChangeText={(v) => set("hoursSaturday", v)}
          placeholder="10:00 AM – 6:00 PM"
        />
        <TextField
          label="Sunday"
          value={form.hoursSunday}
          onChangeText={(v) => set("hoursSunday", v)}
          placeholder="Closed / By appointment"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  cover: {
    alignSelf: "stretch",
    height: 148,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  coverEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  coverText: { ...type.label, color: colors.onPrimary },
  coverBadge: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.overlay,
  },
  coverBadgeText: { ...type.caption, color: colors.onPrimary, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: -40,
    paddingHorizontal: spacing.sm,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 3,
    borderColor: colors.bg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoText: { ...type.title, color: colors.onAccent },
  brandMeta: { flex: 1, gap: 2, paddingTop: 28 },
  firmPreview: { ...type.heading, color: colors.ink },
  ownerPreview: { ...type.caption, color: colors.inkMuted },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: { ...type.caption, color: colors.inkMuted },
  group: { gap: spacing.lg },
  heading: { ...type.heading, color: colors.ink },
  label: { ...type.label, color: colors.inkSecondary },
  fieldBlock: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.md },
});
