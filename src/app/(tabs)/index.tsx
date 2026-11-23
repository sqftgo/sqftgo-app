import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRequireAuth } from "@/components/ds/AuthGate";
import { ErrorState } from "@/components/ds/ErrorState";
import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpertCard } from "@/components/ui/expert-card";
import {
  Bell,
  Building,
  Building2,
  ChevronRight,
  Community,
  Home as HomeIcon,
  KeyRound,
  Leaf,
  MapPin,
  Plus,
  Shop,
} from "@/components/ui/icons";
import { NotificationsSheet, useNotifications } from "@/components/ui/notifications-sheet";
import { ProjectCard } from "@/components/ui/project-card";
import { PropertyCard } from "@/components/ui/property-card";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { DestinationCard } from "@/components/destinations/destination-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useApp } from "@/context/AppContext";
import { DESTINATIONS } from "@/data/destinations";
import { useCities } from "@/hooks/use-cities";
import { apiListProjects } from "@/lib/api/services/projects";
import type { PurposeFilter } from "@/lib/filters";
import { displayNameFromEmail, greetingForHour } from "@/lib/format";
import { isDealerCategory } from "@/lib/is-dealer-category";
import { colors, fonts, radius, shadow, spacing, type } from "@/theme/tokens";

type BrowseIntent = PurposeFilter | "commercial" | "plot";

const BROWSE_INTENTS: {
  id: BrowseIntent;
  label: string;
  hint: string;
  icon: typeof HomeIcon;
  bg: string;
  fg: string;
}[] = [
  { id: "buy", label: "Buy", hint: "Homes for sale", icon: HomeIcon, bg: colors.primarySoft, fg: colors.primary },
  { id: "rent", label: "Rent", hint: "Ready to move", icon: KeyRound, bg: colors.accentSoft, fg: colors.accent },
  { id: "plot", label: "Plots", hint: "Industrial land", icon: Community, bg: colors.successSoft, fg: colors.success },
  { id: "commercial", label: "Commercial", hint: "Shops & offices", icon: Shop, bg: colors.infoSoft, fg: colors.info },
];

const CATEGORIES = [
  { id: "Apartment", title: "Apartments", icon: Building, typeParam: "Apartment", bg: colors.primarySoft, fg: colors.primary },
  { id: "Villa", title: "Villas & homes", icon: HomeIcon, typeParam: "Villa", bg: colors.accentSoft, fg: colors.accent },
  { id: "Commercial", title: "Commercial", icon: Shop, typeParam: "commercial", bg: colors.infoSoft, fg: colors.info },
  { id: "Plot", title: "Industrial plots", icon: Community, typeParam: "Industrial Plot", bg: colors.successSoft, fg: colors.success },
  {
    id: "Agricultural Land",
    title: "Agricultural land",
    icon: Leaf,
    typeParam: "Agricultural Land",
    bg: "rgba(70, 126, 84, 0.14)",
    fg: colors.success,
  },
];

function isAllIndia(city: string) {
  return !city || city.toLowerCase() === "all india";
}

function matchesCity(city: string, selected: string) {
  return isAllIndia(selected) || city.trim().toLowerCase() === selected.trim().toLowerCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    properties,
    selectedCity,
    userEmail,
    userName,
    profile,
    directoryProfiles,
    canPostListing,
    isApiMode,
    catalogLoadFailed,
    reloadCatalog,
  } = useApp();
  const { cities } = useCities();
  const [refreshing, setRefreshing] = useState(false);
  const requireAuth = useRequireAuth();

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const firstName = useMemo(() => {
    const raw = (userName || profile?.name || "").trim();
    if (raw && !/^user$/i.test(raw)) return raw.split(/\s+/)[0];
    const fromEmail = displayNameFromEmail(userEmail).split(/\s+/)[0];
    return fromEmail && !/^user$/i.test(fromEmail) ? fromEmail : "there";
  }, [userName, profile?.name, userEmail]);

  const allIndia = isAllIndia(selectedCity);

  const cityActiveCount = useMemo(
    () => properties.filter((p) => p.status === "Active" && matchesCity(p.city, selectedCity)).length,
    [properties, selectedCity],
  );

  const agriCount = useMemo(
    () =>
      properties.filter(
        (p) =>
          p.status === "Active" &&
          p.type === "Agricultural Land" &&
          matchesCity(p.city, selectedCity),
      ).length,
    [properties, selectedCity],
  );

  const topPicks = useMemo(() => {
    const active = properties.filter((p) => p.status === "Active" && matchesCity(p.city, selectedCity));
    const featured = active.filter((p) => p.featured);
    return (featured.length > 0 ? featured : active).slice(0, 10);
  }, [properties, selectedCity]);

  const cityExperts = useMemo(
    () =>
      directoryProfiles
        .filter((d) => isDealerCategory(d.category) && matchesCity(d.city, selectedCity))
        .slice(0, 3),
    [directoryProfiles, selectedCity],
  );

  const cityImage = useMemo(() => {
    const match = cities.find((c) => c.name.toLowerCase() === selectedCity.trim().toLowerCase());
    return match?.image ?? cities[0]?.image ?? "";
  }, [cities, selectedCity]);

  const projects = useQuery({
    queryKey: ["projects", "home", allIndia ? "all" : selectedCity],
    queryFn: async () =>
      (await apiListProjects({ city: allIndia ? undefined : selectedCity, limit: 10 })).filter(
        (p) => p.status === "Active" || !p.status,
      ),
    enabled: isApiMode,
    staleTime: 5 * 60_000,
  });
  const newProjects = projects.data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reloadCatalog(), isApiMode ? projects.refetch() : null]);
    setRefreshing(false);
  };

  const goToExplore = (purpose?: BrowseIntent, typeParam?: string) => {
    const params: Record<string, string> = {};
    if (purpose === "commercial") params.type = "commercial";
    else if (purpose === "plot") params.type = "Industrial Plot";
    else if (purpose) params.purpose = purpose;
    if (typeParam) params.type = typeParam;
    router.push({ pathname: "/(tabs)/explore", params });
  };

  const goToAgriculturalLand = () => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    goToExplore(undefined, "Agricultural Land");
  };

  const listProperty = () =>
    requireAuth("Sign in to list your property and reach buyers in your city.", () =>
      router.push((canPostListing ? "/post-property" : "/my-listings") as Href),
    );

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={isApiMode ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
      >
        <View style={[styles.pad, { gap: spacing.md, paddingTop: spacing.xs }]}>
          <ScreenNavbar
            eyebrow={`${greetingForHour(new Date().getHours())}, ${firstName}`}
            title={selectedCity}
            onPressTitle={() => setCityModalVisible(true)}
            actions={[
              { icon: Bell, label: "Notifications", badge: unreadCount > 0, onPress: () => setNotificationsVisible(true) },
            ]}
          />

          <View style={styles.heroCard}>
            {cityImage ? (
              <Image source={{ uri: cityImage }} style={styles.heroImage} contentFit="cover" transition={200} />
            ) : null}
            <View style={styles.heroScrim} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <MapPin size={13} color={colors.onAccent} />
                <Text style={styles.heroBadgeText}>{allIndia ? "All India" : selectedCity}</Text>
              </View>
              <Text style={styles.heroTitle}>Find your next home</Text>
              <Text style={styles.heroSubtitle}>
                {cityActiveCount > 0
                  ? `${cityActiveCount} verified ${cityActiveCount === 1 ? "listing" : "listings"} ready to explore`
                  : "Browse verified homes, plots, and commercial spaces"}
              </Text>
            </View>
          </View>

          <View style={styles.browseCard}>
            <Text style={styles.browseEyebrow}>Browse by intent</Text>
            <View style={styles.intentGrid}>
              {BROWSE_INTENTS.map(({ id, label, hint, icon: Icon, bg, fg }) => (
                <Pressable
                  key={id}
                  onPress={() => {
                    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
                    goToExplore(id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${label} properties`}
                  style={({ pressed }) => [styles.intentTile, pressed && { transform: [{ scale: 0.98 }] }]}
                >
                  <View style={[styles.intentIcon, { backgroundColor: bg }]}>
                    <Icon size={18} color={fg} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.intentLabel}>{label}</Text>
                    <Text style={styles.intentHint} numberOfLines={1}>
                      {hint}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.inkMuted} />
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={goToAgriculturalLand}
            accessibilityRole="button"
            accessibilityLabel="Browse agricultural land listings"
            style={({ pressed }) => [styles.agriCard, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.agriIcon}>
              <Leaf size={22} color={colors.onPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.agriTitle}>Agricultural land</Text>
              <Text style={styles.agriText}>
                {agriCount > 0
                  ? `${agriCount} farmland ${agriCount === 1 ? "listing" : "listings"} in ${allIndia ? "India" : selectedCity}`
                  : "Farmland and agri parcels — clear title, ready to browse"}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onPrimaryMuted} />
          </Pressable>
        </View>

        <View style={{ gap: spacing.md }}>
          <View style={styles.pad}>
            <SectionHeader
              title={allIndia ? "Top picks" : `Top picks in ${selectedCity}`}
              actionLabel={topPicks.length > 0 ? "See all" : undefined}
              onAction={topPicks.length > 0 ? () => goToExplore() : undefined}
            />
          </View>
          {topPicks.length > 0 ? (
            <FlatList
              horizontal
              data={topPicks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PropertyCard property={item} variant="compact" />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            />
          ) : catalogLoadFailed ? (
            <View style={styles.pad} accessibilityLiveRegion="polite">
              <ErrorState
                offline
                title="Couldn't load listings"
                message="Check your connection and try again."
                onRetry={refreshing ? undefined : () => void onRefresh()}
              />
            </View>
          ) : (
            <View style={styles.pad}>
              <EmptyState
                compact
                icon={MapPin}
                title={`No listings in ${selectedCity} yet`}
                message="Try another city from the header, or be the first to list here."
                actionLabel="List a property"
                onAction={listProperty}
              />
            </View>
          )}
        </View>

        <View style={{ gap: spacing.md }}>
          <View style={[styles.pad, { gap: spacing.xs }]}>
            <SectionHeader
              title="Cities on SqftGo"
              actionLabel="See all"
              onAction={() => router.push("/destinations" as Href)}
            />
            <Text style={styles.destinationsSub}>Tap a city to open Explore for that market</Text>
          </View>
          <FlatList
            horizontal
            data={DESTINATIONS}
            keyExtractor={(item) => item.slug}
            renderItem={({ item }) => {
              const listingCount = properties.filter(
                (p) => p.status === "Active" && p.city.trim().toLowerCase() === item.name.toLowerCase(),
              ).length;
              return (
                <DestinationCard
                  destination={item}
                  variant="rail"
                  listingCount={listingCount}
                  browseHomes
                />
              );
            }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
          />
        </View>

        {newProjects.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <View style={styles.pad}>
              <SectionHeader title="New projects" actionLabel="See all" onAction={() => router.push("/projects" as Href)} />
            </View>
            <FlatList
              horizontal
              data={newProjects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProjectCard project={item} variant="compact" />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            />
          </View>
        ) : null}

        <View style={[styles.pad, { gap: spacing.md }]}>
          <SectionHeader title="Explore by type" actionLabel="All filters" onAction={() => goToExplore()} />
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => goToExplore(undefined, cat.typeParam)}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${cat.title}`}
                  style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.98 }] }]}
                >
                  <View style={[styles.tileIcon, { backgroundColor: cat.bg }]}>
                    <Icon size={20} color={cat.fg} strokeWidth={2} />
                  </View>
                  <Text style={styles.tileTitle} numberOfLines={2}>
                    {cat.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {cityExperts.length > 0 ? (
          <View style={[styles.pad, { gap: spacing.md }]}>
            <SectionHeader title="Trusted dealers" actionLabel="View all" onAction={() => router.push("/brokers" as Href)} />
            <View style={{ gap: spacing.md }}>
              {cityExperts.map((expert) => (
                <ExpertCard key={expert.id} profile={expert} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.pad}>
          <Pressable
            onPress={listProperty}
            accessibilityRole="button"
            accessibilityLabel="List your property for free"
            style={({ pressed }) => [styles.sellCard, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.sellIcon}>
              <Plus size={22} color={colors.onAccent} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.sellTitle}>List your property free</Text>
              <Text style={styles.sellText}>
                Reach buyers and tenants in {allIndia ? "your city" : selectedCity}
              </Text>
            </View>
            <Building2 size={24} color={colors.onPrimaryMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
      <NotificationsSheet
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl + spacing.lg, gap: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
  heroCard: {
    height: 168,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(27, 56, 100, 0.55)",
  },
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.xs,
    marginBottom: spacing.xs,
  },
  heroBadgeText: {
    ...type.micro,
    fontFamily: fonts.sansSemiBold,
    color: colors.onAccent,
  },
  heroTitle: {
    ...type.title,
    color: colors.onPrimary,
  },
  heroSubtitle: {
    ...type.caption,
    color: colors.onPrimaryMuted,
    maxWidth: 300,
  },
  browseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    boxShadow: shadow.card,
  },
  browseEyebrow: {
    ...type.label,
    color: colors.inkSecondary,
  },
  intentGrid: { gap: spacing.sm },
  intentTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    minHeight: 56,
  },
  intentIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  intentLabel: { ...type.emphasis, color: colors.ink },
  intentHint: { ...type.caption, color: colors.inkMuted },
  agriCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.success,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.lg,
    boxShadow: shadow.raised,
  },
  agriIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  agriTitle: { ...type.emphasis, color: colors.onPrimary },
  agriText: { ...type.caption, color: "rgba(255,255,255,0.82)" },
  destinationsSub: { ...type.caption, color: colors.inkMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 64,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { ...type.emphasis, color: colors.ink, flexShrink: 1, flex: 1 },
  sellCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.lg,
    boxShadow: shadow.raised,
  },
  sellIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sellTitle: { ...type.emphasis, color: colors.onPrimary },
  sellText: { ...type.caption, color: colors.onPrimaryMuted },
});
