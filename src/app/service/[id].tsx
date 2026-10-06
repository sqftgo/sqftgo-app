import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import {
  Button,
  DateTimeField,
  EmptyState,
  ErrorState,
  ListRow,
  ListSection,
  Screen,
  Skeleton,
  TextField,
  useRequireAuth,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { CheckCircle, Compass, Globe, Mail, MapPin, Phone, ShieldCheck } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/lib/api/client";
import { isApiMode } from "@/lib/api/config";
import { apiGetDealer } from "@/lib/api/services/dealers";
import { apiCreateServiceBooking } from "@/lib/api/services/services";
import { initialsFromName } from "@/lib/format";
import { isServiceDirectoryCategory } from "@/lib/is-dealer-category";
import { colors, radius, spacing, type } from "@/theme/tokens";

function tomorrowAt11() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  return d;
}

function open(url: string) {
  Linking.openURL(url).catch(() => appAlert("Can't open link", "This isn't supported on this device."));
}

export default function ServiceProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { directoryProfiles, profile: me, userEmail } = useApp();
  const requireAuth = useRequireAuth();

  const cached = useMemo(() => directoryProfiles.find((d) => d.id === id), [directoryProfiles, id]);
  const remote = useQuery({
    queryKey: ["dealer", id],
    queryFn: () => apiGetDealer(id),
    enabled: isApiMode && Boolean(id),
  });
  const partner = remote.data ?? cached;

  const [when, setWhen] = useState(tomorrowAt11);
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [message, setMessage] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const booking = useMutation({
    mutationFn: () =>
      apiCreateServiceBooking(id, {
        preferredAt: when.toISOString(),
        contactPhone: phone.trim(),
        message: message.trim() || undefined,
      }),
    onError: (e) => appAlert("Couldn't send request", e instanceof Error ? e.message : "Please try again."),
  });

  if (!partner || !isServiceDirectoryCategory(partner.category)) {
    if (remote.isLoading) {
      return (
        <Screen title="Service partner" fallbackHref="/(tabs)/services">
          <Skeleton height={120} />
          <Skeleton width="60%" height={24} />
          <Skeleton height={160} />
        </Screen>
      );
    }
    const notFound = !isApiMode || partner || (remote.error instanceof ApiError && remote.error.status === 404);
    return (
      <Screen title="Service partner" fallbackHref="/(tabs)/services">
        {notFound ? (
          <EmptyState
            icon={Compass}
            title="Partner not found"
            message="This service profile doesn't exist or is no longer listed."
            actionLabel="Browse services"
            onAction={() => router.replace("/(tabs)/services")}
          />
        ) : (
          <ErrorState onRetry={() => void remote.refetch()} />
        )}
      </Screen>
    );
  }

  const isOwner =
    (me?.id && partner.userId === me.id) ||
    (userEmail && partner.email?.toLowerCase() === userEmail.toLowerCase());
  const verified = partner.verificationStatus === "verified";
  const logo = partner.logoUrl || partner.avatarUrl;
  const mapQuery = encodeURIComponent([partner.address, partner.city, "India"].filter(Boolean).join(", "));

  const submit = () => {
    if (!requireAuth("Sign in to request a booking with this partner.")) return;
    if (phone.trim().length < 5) {
      setPhoneError("Enter a phone number the partner can call.");
      return;
    }
    if (when.getTime() <= Date.now()) {
      appAlert("Pick a later time", "Choose a time in the future.");
      return;
    }
    booking.mutate();
  };

  return (
    <Screen title={partner.firmName} subtitle={partner.category} fallbackHref="/(tabs)/services">
      <View style={styles.header}>
        <View style={styles.logo}>
          {logo ? (
            <Image source={{ uri: logo }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={styles.initials}>{initialsFromName(partner.firmName || partner.ownerName)}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.category}>{partner.category}</Text>
          <Text style={styles.firm}>{partner.firmName}</Text>
          <Text style={styles.owner}>
            {partner.ownerName} · {partner.city}
          </Text>
          {verified ? (
            <View style={styles.verified}>
              <ShieldCheck size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified by SqftGo</Text>
            </View>
          ) : null}
        </View>
      </View>

      {partner.description ? <Text style={styles.body}>{partner.description}</Text> : null}

      {partner.servicesOffered?.length ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Services offered</Text>
          <View style={styles.chips}>
            {partner.servicesOffered.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <ListSection title="Contact">
        {partner.address || partner.city ? (
          <ListRow
            icon={MapPin}
            title={[partner.address, partner.city].filter(Boolean).join(", ")}
            subtitle="Open in maps"
            onPress={() => open(`https://maps.google.com/?q=${mapQuery}`)}
          />
        ) : null}
        {partner.mobile ? (
          <ListRow icon={Phone} title={partner.mobile} onPress={() => open(`tel:${partner.mobile.replace(/\s/g, "")}`)} />
        ) : null}
        {partner.email ? (
          <ListRow icon={Mail} title={partner.email} onPress={() => open(`mailto:${partner.email}`)} />
        ) : null}
        {partner.website ? (
          <ListRow
            icon={Globe}
            title={partner.website.replace(/^https?:\/\//, "")}
            onPress={() => open(partner.website!.startsWith("http") ? partner.website! : `https://${partner.website}`)}
          />
        ) : null}
      </ListSection>

      {isOwner ? (
        <View style={styles.card}>
          <Text style={styles.blockTitle}>This is your profile</Text>
          <Text style={styles.muted}>Edit details, verification and booking requests from Manage.</Text>
          <Button label="Manage service profile" onPress={() => router.push("/services/manage" as Href)} />
        </View>
      ) : booking.isSuccess ? (
        <View style={[styles.card, styles.success]}>
          <CheckCircle size={28} color={colors.success} />
          <Text style={styles.blockTitle}>Request sent</Text>
          <Text style={styles.muted}>
            {partner.firmName} will confirm your visit. Track it in your service bookings.
          </Text>
          <Button label="View my bookings" variant="secondary" onPress={() => router.push("/my-service-bookings")} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.blockTitle}>Book a visit</Text>
          <Text style={styles.muted}>Pick a time that suits you. The partner confirms the request.</Text>
          <DateTimeField label="Preferred time" value={when} onChange={setWhen} />
          <TextField
            label="Your phone"
            required
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setPhoneError(null);
            }}
            error={phoneError}
          />
          <TextField
            label="What do you need?"
            multiline
            maxLength={4000}
            placeholder="e.g. 2 BHK interiors, budget around ₹6 L"
            value={message}
            onChangeText={setMessage}
          />
          <Button label="Request booking" size="lg" loading={booking.isPending} onPress={submit} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { ...type.title, color: colors.onPrimary },
  headerText: { flex: 1, gap: spacing.xxs },
  category: { ...type.caption, color: colors.accent },
  firm: { ...type.title, color: colors.ink },
  owner: { ...type.body, color: colors.inkSecondary },
  verified: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  verifiedText: { ...type.label, color: colors.success },
  body: { ...type.body, color: colors.inkSecondary },
  block: { gap: spacing.sm },
  blockTitle: { ...type.heading, color: colors.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...type.label, color: colors.inkSecondary },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  success: { alignItems: "flex-start", borderColor: colors.success, backgroundColor: colors.successSoft },
  muted: { ...type.body, color: colors.inkMuted },
});
