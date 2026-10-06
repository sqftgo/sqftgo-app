import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { ListRow, ListSection } from "@/components/ds/ListRow";
import { Screen } from "@/components/ds/Screen";
import { TextField } from "@/components/ds/TextField";
import { toast } from "@/components/ds/Toast";
import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { appAlert } from "@/components/ui/app-alert";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Store } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { DirectoryCategory } from "@/data/types";
import { initialsFromName } from "@/lib/format";
import { pickAndUploadPropertyImage } from "@/lib/media-upload";
import { ownsDirectory } from "@/lib/ownership";
import { colors, radius, spacing, type } from "@/theme/tokens";

const CATEGORIES: DirectoryCategory[] = [
  "Agent & Broker",
  "Builder & Developer",
  "Property Consultant",
  "Interior Decorator",
  "Architect",
  "Building Contractor",
  "Vastu Consultant",
  "Home Valuation/Inspection",
  "Home Shifting/Deep Cleaning",
  "Architect & Interior Designer",
  "House Services",
  "Movers & Packers",
  "Contractors",
  "Event Managers",
  "Wedding Planners",
];

const SPECIALTIES = [
  "Heritage Havelis",
  "Lakefront Villas",
  "Agricultural Lands",
  "RERA Clearances",
  "Commercial Leases",
  "Title Checks",
  "Luxury Apartments",
  "Bungalows",
  "Plots & Land",
];

type Errors = Partial<Record<"firmName" | "ownerName" | "mobile" | "email" | "city", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    category: (mine?.category ?? "Agent & Broker") as DirectoryCategory,
    city: mine?.city ?? "",
    address: mine?.address ?? "",
    mobile: mine?.mobile ?? profile?.phone ?? "",
    email: mine?.email ?? userEmail,
    website: mine?.website ?? "",
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
  const [cityOpen, setCityOpen] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  if (!mine) {
    return (
      <Screen title="Business profile">
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
    setUploading(which);
    try {
      const url = await pickAndUploadPropertyImage();
      if (url) set(which === "logo" ? "logoUrl" : "coverImageUrl", url);
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    const e: Errors = {};
    if (form.firmName.trim().length < 2) e.firmName = "Enter your firm name.";
    if (form.ownerName.trim().length < 2) e.ownerName = "Enter the owner or representative name.";
    if (form.mobile.trim().length < 5) e.mobile = "Enter a contact number.";
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
      website: form.website.trim(),
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

  const toggleSpecialty = (s: string) =>
    set("specialties", form.specialties.includes(s) ? form.specialties.filter((x) => x !== s) : [...form.specialties, s]);

  return (
    <Screen
      title="Business profile"
      fallbackHref={"/(dealer)/profile" as Href}
      rightAction={
        <Button
          label="Preview"
          variant="tertiary"
          onPress={() => router.push({ pathname: "/broker/[id]", params: { id: mine.id } })}
        />
      }
      footer={<Button label="Save business profile" loading={saving} disabled={Boolean(uploading)} onPress={() => void save()} fullWidth />}
    >
      <View style={styles.brand}>
        <Pressable
          onPress={() => void upload("cover")}
          disabled={!isApiMode || Boolean(uploading)}
          style={styles.cover}
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
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => void upload("logo")}
          disabled={!isApiMode || Boolean(uploading)}
          style={styles.logo}
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
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
        </Pressable>
        <Text style={styles.caption}>Tap the cover or logo to change it.</Text>
      </View>

      <ListSection footer="Hidden profiles don't appear in the public dealer directory.">
        <ListRow
          title="Show in directory"
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
        <TextField label="Firm name" required value={form.firmName} onChangeText={(v) => set("firmName", v)} maxLength={160} error={errors.firmName} />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} selected={form.category === c} onPress={() => set("category", c)} />
            ))}
          </View>
        </View>
        <Pressable onPress={() => setCityOpen(true)} accessibilityRole="button" accessibilityLabel="Operating city">
          <View pointerEvents="none">
            <TextField label="Operating city" required value={form.city} placeholder="Choose city" editable={false} suffix="›" error={errors.city} />
          </View>
        </Pressable>
        <TextField label="Office address" value={form.address} onChangeText={(v) => set("address", v)} maxLength={300} />
        <TextField label="RERA ID" value={form.reraId} onChangeText={(v) => set("reraId", v)} autoCapitalize="characters" maxLength={80} />
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
        <TextField label="Owner / representative" required value={form.ownerName} onChangeText={(v) => set("ownerName", v)} maxLength={120} error={errors.ownerName} />
        <TextField label="Mobile" required value={form.mobile} onChangeText={(v) => set("mobile", v)} keyboardType="phone-pad" maxLength={40} error={errors.mobile} />
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
        <TextField label="Website" value={form.website} onChangeText={(v) => set("website", v)} keyboardType="url" autoCapitalize="none" maxLength={200} />
      </View>

      <View style={styles.group}>
        <Text style={styles.heading}>Specialties</Text>
        <View style={styles.chips}>
          {SPECIALTIES.map((s) => (
            <Chip key={s} label={s} selected={form.specialties.includes(s)} onPress={() => toggleSpecialty(s)} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.heading}>Business hours</Text>
        <TextField label="Monday – Friday" value={form.hoursWeekdays} onChangeText={(v) => set("hoursWeekdays", v)} placeholder="9:30 AM – 7:30 PM" />
        <TextField label="Saturday" value={form.hoursSaturday} onChangeText={(v) => set("hoursSaturday", v)} placeholder="10:00 AM – 6:00 PM" />
        <TextField label="Sunday" value={form.hoursSunday} onChangeText={(v) => set("hoursSunday", v)} placeholder="Closed / By appointment" />
      </View>

      <CitySelectionModal visible={cityOpen} onClose={() => setCityOpen(false)} value={form.city} onSelect={(c) => set("city", c)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", gap: spacing.sm },
  cover: {
    alignSelf: "stretch",
    height: 140,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  coverEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  coverText: { ...type.label, color: colors.onPrimary },
  logo: {
    width: 84,
    height: 84,
    marginTop: -48,
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center" },
  caption: { ...type.caption, color: colors.inkMuted },
  group: { gap: spacing.lg },
  heading: { ...type.heading, color: colors.ink },
  label: { ...type.label, color: colors.inkSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.md },
});
