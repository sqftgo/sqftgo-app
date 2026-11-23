import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Chip,
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
import {
  CheckCircle,
  Clock,
  Compass,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  User,
} from "@/components/ui/icons";
import { serviceIconFor } from "@/components/ui/service-card";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/lib/api/client";
import { isApiMode } from "@/lib/api/config";
import { apiGetDealer } from "@/lib/api/services/dealers";
import { createServiceBooking, listProviderServices } from "@/lib/api/services/provider";
import { mobileAuthConfigured } from "@/lib/api/supabase";
import { apiCreateServiceBooking } from "@/lib/api/services/services";
import { userFacingError } from "@/lib/errors";
import { initialsFromName } from "@/lib/format";
import { isDirectoryVerified, isServiceDirectoryCategory } from "@/lib/is-dealer-category";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function tomorrowAt11() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  return d;
}

function open(url: string) {
  Linking.openURL(url).catch(() => appAlert("Can't open link", "This isn't supported on this device."));
}

function formatHours(hours: Record<string, string> | null | undefined): string[] {
  if (!hours) return [];
  return Object.entries(hours)
    .filter(([, v]) => Boolean(v?.trim()))
    .map(([day, value]) => `${day}: ${value.trim()}`);
}

export default function ServiceProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { directoryProfiles, profile: me, userEmail, serviceAccess } = useApp();
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
  const [location, setLocation] = useState("");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const servicesQuery = useQuery({
    queryKey: ["provider-services", id],
    queryFn: () => listProviderServices(id),
    enabled: mobileAuthConfigured && Boolean(id),
  });

  const booking = useMutation({
    mutationFn: async () => {
      if (mobileAuthConfigured) {
        return createServiceBooking({
          directoryProfileId: id,
          preferredAt: when.toISOString(),
          contactPhone: phone.trim(),
          message: message.trim() || undefined,
          serviceId,
          location: location.trim() || null,
        });
      }
      const created = await apiCreateServiceBooking(id, {
        preferredAt: when.toISOString(),
        contactPhone: phone.trim(),
        message: message.trim() || undefined,
      });
      return { ...created, message: created.message ?? null };
    },
    onError: (e) => appAlert("Couldn't send request", userFacingError(e, "Please try again.")),
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
  const verified = isDirectoryVerified(partner);
  const logo = partner.logoUrl || partner.avatarUrl;
  const cover = partner.coverImageUrl || partner.coverUrl;
  const mapQuery = encodeURIComponent([partner.address, partner.city, "India"].filter(Boolean).join(", "));
  const CategoryIcon = serviceIconFor(partner.category);
  const services =
    partner.servicesOffered?.length
      ? partner.servicesOffered
      : partner.specialties?.length
        ? partner.specialties
        : [];
  const hours = formatHours(partner.businessHours);
  const rating =
    typeof partner.rating === "number" && partner.rating > 0
      ? partner.rating.toFixed(1)
      : null;
  const reviews =
    typeof partner.reviewsCount === "number" && partner.reviewsCount > 0
      ? partner.reviewsCount
      : null;
  const phoneDigits = partner.mobile?.replace(/\s/g, "") ?? "";

  const submit = () => {
    requireAuth("Sign in to request a booking with this partner.", () => {
      if (phone.trim().length < 5) {
        setPhoneError("Enter a phone number the partner can call.");
        return;
      }
      if (when.getTime() <= Date.now()) {
        appAlert("Pick a later time", "Choose a time in the future.");
        return;
      }
      booking.mutate();
    });
  };

  return (
    <Screen title={partner.firmName} subtitle={partner.category} fallbackHref="/(tabs)/services">
      {cover ? (
        <View style={styles.cover}>
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.coverScrim} />
        </View>
      ) : null}

      <View style={styles.headerCard}>
        <View style={styles.logo}>
          {logo ? (
            <Image source={{ uri: logo }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={styles.initials}>{initialsFromName(partner.firmName || partner.ownerName)}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryIcon}>
              <CategoryIcon size={14} color={colors.accent} strokeWidth={2} />
            </View>
            <Text style={styles.category}>{partner.category}</Text>
          </View>
          <Text style={styles.firm}>{partner.firmName}</Text>
          {partner.ownerName ? (
            <View style={styles.ownerRow}>
              <User size={13} color={colors.inkMuted} />
              <Text style={styles.owner}>
                Principal · {partner.ownerName}
                {partner.city ? ` · ${partner.city}` : ""}
              </Text>
            </View>
          ) : partner.city ? (
            <Text style={styles.owner}>{partner.city}, Bharat</Text>
          ) : null}
          {verified ? (
            <View style={styles.verified}>
              <ShieldCheck size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified by SqftGo</Text>
            </View>
          ) : (
            <Text style={styles.directoryBadge}>Directory listing</Text>
          )}
        </View>
      </View>

      {(phoneDigits || partner.email) && !isOwner ? (
        <View style={styles.quickActions}>
          {phoneDigits ? (
            <Pressable
              onPress={() => open(`tel:${phoneDigits}`)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${partner.firmName}`}
              style={({ pressed }) => [styles.quickBtn, styles.quickPrimary, pressed && { opacity: 0.9 }]}
            >
              <Phone size={16} color={colors.onAccent} />
              <Text style={styles.quickPrimaryText}>Call</Text>
            </Pressable>
          ) : null}
          {partner.email ? (
            <Pressable
              onPress={() =>
                open(`mailto:${partner.email}?subject=${encodeURIComponent(`Inquiry for ${partner.firmName}`)}`)
              }
              accessibilityRole="button"
              accessibilityLabel={`Email ${partner.firmName}`}
              style={({ pressed }) => [styles.quickBtn, styles.quickSecondary, pressed && { opacity: 0.9 }]}
            >
              <Mail size={16} color={colors.ink} />
              <Text style={styles.quickSecondaryText}>Email</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {partner.description ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>About the business</Text>
          <Text style={styles.body}>{partner.description}</Text>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Business credentials</Text>
        <View style={styles.credGrid}>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Experience</Text>
            <Text style={styles.credValue}>{partner.experience?.trim() || "—"}</Text>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Services</Text>
            <Text style={styles.credValue}>
              {services.length > 0 ? `${services.length} listed` : "—"}
            </Text>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Rating</Text>
            <View style={styles.ratingRow}>
              {rating ? <Star size={14} color={colors.star} /> : null}
              <Text style={styles.credValue}>
                {rating
                  ? `${rating}${reviews != null ? ` · ${reviews} reviews` : ""}`
                  : "No reviews yet"}
              </Text>
            </View>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Status</Text>
            <Text style={styles.credValue}>{verified ? "SqftGo vetted" : "Directory listing"}</Text>
          </View>
          {partner.teamSize ? (
            <View style={styles.credItem}>
              <Text style={styles.credLabel}>Team size</Text>
              <Text style={styles.credValue}>{partner.teamSize}</Text>
            </View>
          ) : null}
          {partner.languages?.length ? (
            <View style={styles.credItem}>
              <Text style={styles.credLabel}>Languages</Text>
              <Text style={styles.credValue}>{partner.languages.join(", ")}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {services.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Services offered</Text>
          <View style={styles.chips}>
            {services.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {hours.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Business hours</Text>
          {hours.map((line) => (
            <View key={line} style={styles.hourRow}>
              <Clock size={14} color={colors.inkMuted} />
              <Text style={styles.hourText}>{line}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <ListSection title="Business contacts">
        {partner.address || partner.city ? (
          <ListRow
            icon={MapPin}
            title={[partner.address, partner.city].filter(Boolean).join(", ")}
            subtitle="Open in maps"
            onPress={() => open(`https://maps.google.com/?q=${mapQuery}`)}
          />
        ) : null}
        {partner.mobile ? (
          <ListRow icon={Phone} title={partner.mobile} onPress={() => open(`tel:${phoneDigits}`)} />
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
          <Button
            label={serviceAccess === "approved" ? "Open dashboard" : "Manage service profile"}
            onPress={() => router.push((serviceAccess === "approved" ? "/services/dashboard" : "/services/manage") as Href)}
          />
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
          <Text style={styles.blockTitle}>Book / enquire</Text>
          <Text style={styles.muted}>
            Request a preferred time. The provider confirms from their dashboard.
          </Text>
          <DateTimeField label="Preferred date & time" value={when} onChange={setWhen} />
          {(servicesQuery.data ?? []).filter((item) => item.active).length > 0 ? (
            <View style={styles.chips}>
              {(servicesQuery.data ?? [])
                .filter((item) => item.active)
                .map((item) => (
                  <Chip
                    key={item.id}
                    label={item.priceInr == null ? item.name : `${item.name} · ₹${item.priceInr}`}
                    selected={serviceId === item.id}
                    onPress={() => setServiceId(serviceId === item.id ? null : item.id)}
                  />
                ))}
            </View>
          ) : null}
          <TextField
            label="Service location"
            value={location}
            onChangeText={setLocation}
            placeholder="Address for the visit, if it is not at the business"
          />
          <TextField
            label="Contact phone"
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
            label="Message"
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
  cover: {
    height: 120,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.primary,
    overflow: "hidden",
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(27, 56, 100, 0.25)",
  },
  headerCard: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: { ...type.title, color: colors.onPrimary },
  headerText: { flex: 1, gap: spacing.xxs },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  categoryIcon: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  category: { ...type.caption, color: colors.accent, fontWeight: "600" },
  firm: { ...type.title, color: colors.ink },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  owner: { ...type.body, color: colors.inkSecondary, flex: 1 },
  verified: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  verifiedText: { ...type.label, color: colors.success },
  directoryBadge: { ...type.caption, color: colors.inkMuted, marginTop: spacing.xs },
  quickActions: { flexDirection: "row", gap: spacing.sm },
  quickBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  quickPrimary: { backgroundColor: colors.accent },
  quickPrimaryText: { ...type.emphasis, color: colors.onAccent },
  quickSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  quickSecondaryText: { ...type.emphasis, color: colors.ink },
  body: { ...type.body, color: colors.inkSecondary },
  block: { gap: spacing.sm },
  blockTitle: { ...type.heading, color: colors.ink },
  credGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  credItem: {
    width: "48%",
    flexGrow: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  credLabel: { ...type.caption, color: colors.inkMuted },
  credValue: { ...type.emphasis, color: colors.ink },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...type.label, color: colors.inkSecondary },
  hourRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hourText: { ...type.body, color: colors.inkSecondary },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
  },
  success: { alignItems: "flex-start", borderColor: colors.success, backgroundColor: colors.successSoft },
  muted: { ...type.body, color: colors.inkMuted },
});
