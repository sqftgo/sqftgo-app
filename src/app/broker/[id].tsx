import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useMemo } from "react";
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ds/Button";
import { ErrorState } from "@/components/ds/ErrorState";
import { ListRow, ListSection } from "@/components/ds/ListRow";
import { Skeleton } from "@/components/ds/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Briefcase,
  Building2,
  ChevronLeft,
  Clock,
  FileCheck,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  ShieldCheck,
  User,
  Users,
} from "@/components/ui/icons";
import { appAlert } from "@/components/ui/app-alert";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import { isApiMode } from "@/lib/api/config";
import { apiGetDealer } from "@/lib/api/services/dealers";
import { initialsFromName } from "@/lib/format";
import { isDirectoryVerified } from "@/lib/is-dealer-category";
import { filterDealerListings } from "@/lib/ownership";
import { colors, radius, shadow, spacing, touchTarget, type } from "@/theme/tokens";

const HOURS_LABEL: Record<string, string> = {
  weekdays: "Mon – Fri",
  saturday: "Saturday",
  sunday: "Sunday",
};

function openUrl(url: string, failTitle: string) {
  Linking.openURL(url).catch(() => appAlert(failTitle, "This isn't supported on this device."));
}

/** Locality line without repeating the city when address already includes it. */
function formatPlace(address?: string | null, city?: string | null): string {
  const c = (city ?? "").trim();
  let a = (address ?? "").trim();
  if (!a && !c) return "";
  if (!a) return c;
  if (!c) return a;
  const cityRe = new RegExp(`[\\s,]*${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  a = a.replace(cityRe, "").replace(/[,\s]+$/, "").trim();
  return a ? `${a}, ${c}` : c;
}

export default function BrokerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { directoryProfiles, properties } = useApp();

  const cached = useMemo(() => directoryProfiles.find((d) => d.id === id), [directoryProfiles, id]);
  const remote = useQuery({
    queryKey: ["dealer", id],
    queryFn: () => apiGetDealer(id),
    enabled: isApiMode && Boolean(id),
  });
  const broker = remote.data ?? cached;

  const listings = useMemo(
    () => (broker ? filterDealerListings(properties, broker) : []),
    [properties, broker],
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace("/brokers" as Href));

  if (!broker) {
    return (
      <SafeAreaView style={styles.fallback}>
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable
          onPress={back}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.fallbackBack}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        {isApiMode && remote.isLoading ? (
          <View style={{ alignSelf: "stretch", padding: spacing.xl, gap: spacing.md }}>
            <Skeleton height={140} />
            <Skeleton width="60%" height={26} />
            <Skeleton width="40%" height={18} />
            <Skeleton height={120} />
          </View>
        ) : remote.isError && (remote.error as { status?: number })?.status !== 404 ? (
          <ErrorState
            message="Check your connection and try again."
            onRetry={() => void remote.refetch()}
          />
        ) : (
          <EmptyState
            icon={Building2}
            title="Profile not found"
            message="This dealer profile doesn't exist or has been removed."
            actionLabel="Browse dealers"
            onAction={() => router.replace("/brokers" as Href)}
          />
        )}
      </SafeAreaView>
    );
  }

  const phone = broker.mobile?.trim();
  const email = broker.email?.trim();
  const logo = broker.logoUrl || broker.avatarUrl;
  const cover = broker.coverImageUrl || broker.coverUrl;
  const firm = (broker.firmName || broker.ownerName).trim();
  const owner = (broker.ownerName || "").trim();
  const showOwner = Boolean(owner && owner.toLowerCase() !== firm.toLowerCase());
  const place = formatPlace(broker.address, broker.city);
  const verified = isDirectoryVerified(broker);
  const hours = broker.businessHours
    ? Object.entries(broker.businessHours).filter(([, v]) => Boolean(v?.trim?.() ?? v))
    : [];
  const specialties = broker.specialties?.filter(Boolean) ?? [];

  const share = async () => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    try {
      await Share.share({
        title: firm,
        message: `${firm} (${broker.category}) on SqftGo${phone ? ` · ${phone}` : ""}${
          place ? ` · ${place}` : ""
        }`,
      });
    } catch {
      // dismissed
    }
  };

  const call = () => phone && openUrl(`tel:${phone.replace(/\s/g, "")}`, "Unable to call");
  const whatsapp = () =>
    phone &&
    openUrl(
      `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hello${showOwner ? ` ${owner}` : ""}, I found ${firm} on SqftGo and would like to know more.`,
      )}`,
      "Unable to open WhatsApp",
    );
  const mail = () =>
    email &&
    openUrl(
      `mailto:${email}?subject=${encodeURIComponent(`Inquiry for ${firm}`)}`,
      "Unable to open mail",
    );

  const credentials = [
    broker.experience?.trim()
      ? { icon: Briefcase, title: "Experience", value: broker.experience.trim() }
      : null,
    broker.teamSize
      ? { icon: Users, title: "Team size", value: String(broker.teamSize) }
      : null,
    {
      icon: Building2,
      title: "Active listings",
      value: String(listings.length),
    },
    broker.reraId?.trim()
      ? { icon: FileCheck, title: "RERA ID", value: broker.reraId.trim() }
      : null,
  ].filter((c): c is { icon: typeof Briefcase; title: string; value: string } => c !== null);

  const officeRows = [
    place ? { icon: MapPin, title: place, onPress: undefined as undefined | (() => void) } : null,
    phone ? { icon: Phone, title: phone, onPress: call } : null,
    email ? { icon: Mail, title: email, onPress: mail } : null,
    ...hours.map(([k, v]) => ({
      icon: Clock,
      title: HOURS_LABEL[k] ?? k,
      value: v,
      onPress: undefined as undefined | (() => void),
    })),
  ].filter(Boolean) as Array<{
    icon: typeof MapPin;
    title: string;
    value?: string;
    onPress?: () => void;
  }>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: (phone || email ? 96 : spacing.xl) + insets.bottom,
        }}
      >
        <View style={[styles.cover, { height: 160 + insets.top }]}>
          {cover ? (
            <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : null}
          <View style={styles.coverShade} />
        </View>

        <View style={styles.headerCard}>
          <View style={styles.logo}>
            {logo ? (
              <Image
                source={{ uri: logo }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.initials}>{initialsFromName(firm)}</Text>
            )}
          </View>
          <Text style={styles.category}>{broker.category}</Text>
          <Text style={styles.firm}>{firm}</Text>
          {showOwner ? (
            <View style={styles.ownerRow}>
              <User size={14} color={colors.inkMuted} />
              <Text style={styles.owner}>Owner · {owner}</Text>
            </View>
          ) : null}
          {verified || broker.reraId ? (
            <View style={styles.badgeRow}>
              {verified ? (
                <View style={styles.badge}>
                  <ShieldCheck size={12} color={colors.success} />
                  <Text style={styles.badgeText}>Verified</Text>
                </View>
              ) : null}
              {broker.reraId?.trim() ? (
                <View style={styles.badge}>
                  <FileCheck size={12} color={colors.success} />
                  <Text style={styles.badgeText}>RERA</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {place ? (
            <View style={styles.cityRow}>
              <MapPin size={14} color={colors.inkMuted} />
              <Text style={styles.city}>{place}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {broker.description?.trim() ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.desc} selectable>
                {broker.description.trim()}
              </Text>
            </View>
          ) : null}

          {credentials.length > 0 ? (
            <ListSection title="At a glance">
              {credentials.map((c) => (
                <ListRow
                  key={c.title}
                  icon={c.icon}
                  title={c.title}
                  value={c.value}
                  showChevron={false}
                />
              ))}
            </ListSection>
          ) : null}

          {specialties.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <View style={styles.chips}>
                {specialties.map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {officeRows.length > 0 ? (
            <ListSection title="Contact & office">
              {officeRows.map((row) => (
                <ListRow
                  key={`${row.title}-${row.value ?? ""}`}
                  icon={row.icon}
                  title={row.title}
                  value={"value" in row ? row.value : undefined}
                  onPress={row.onPress}
                  showChevron={Boolean(row.onPress)}
                />
              ))}
            </ListSection>
          ) : null}

          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>
              Listings{listings.length > 0 ? ` · ${listings.length}` : ""}
            </Text>
            {listings.length === 0 ? (
              <Text style={styles.muted}>No active listings from this dealer right now.</Text>
            ) : (
              listings.map((p) => <PropertyCard key={p.id} property={p} />)
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <Pressable
          onPress={back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.roundBtn}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={share}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share profile"
          style={styles.roundBtn}
        >
          <Share2 size={18} color={colors.ink} />
        </Pressable>
      </View>

      {phone || email ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {phone ? (
            <>
              <Button label="Call" icon={Phone} variant="secondary" onPress={call} style={{ flex: 1 }} />
              <Button
                label="WhatsApp"
                icon={MessageSquare}
                onPress={whatsapp}
                style={{ flex: 1.3 }}
              />
            </>
          ) : (
            <Button label="Email" icon={Mail} onPress={mail} fullWidth />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackBack: {
    position: "absolute",
    top: spacing["4xl"],
    left: spacing.lg,
    padding: spacing.sm,
    zIndex: 2,
  },
  cover: { backgroundColor: colors.primary },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 30, 54, 0.25)",
  },
  headerCard: {
    marginTop: -48,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    paddingTop: 0,
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
  },
  logo: {
    width: 80,
    height: 80,
    marginTop: -40,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: { ...type.title, color: colors.onPrimary },
  category: {
    ...type.micro,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  firm: { ...type.title, color: colors.ink, textAlign: "center" },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  owner: { ...type.body, color: colors.inkSecondary },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.successSoft,
  },
  badgeText: { ...type.micro, color: colors.success, fontWeight: "700" },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  city: { ...type.caption, color: colors.inkMuted, textAlign: "center" },
  body: { padding: spacing.lg, gap: spacing.xxl },
  sectionTitle: { ...type.heading, color: colors.ink },
  desc: { ...type.body, color: colors.inkSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...type.label, color: colors.ink },
  muted: { ...type.body, color: colors.inkMuted },
  topBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roundBtn: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: shadow.card,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
