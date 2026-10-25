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
  MapPin,
  Plus,
  Search,
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

type ExploreIntent = PurposeFilter | "commercial" | "plot";

const INTENTS: { id: ExploreIntent; label: string; icon: typeof HomeIcon }[] = [
  { id: "buy", label: "Buy", icon: HomeIcon },
  { id: "rent", label: "Rent", icon: KeyRound },
  { id: "plot", label: "Plots", icon: Community },
];

const CATEGORIES = [
  { id: "Apartment", title: "Apartments", icon: Building, typeParam: "Apartment", bg: colors.primarySoft, fg: colors.primary },
  { id: "Villa", title: "Villas & homes", icon: HomeIcon, typeParam: "Villa", bg: colors.accentSoft, fg: colors.accent },
  { id: "Commercial", title: "Commercial", icon: Shop, typeParam: "commercial", bg: colors.infoSoft, fg: colors.info },
  { id: "Plot", title: "Plots & land", icon: Community, typeParam: "Industrial Plot", bg: colors.successSoft, fg: colors.success },
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
  const [selectedIntent, setSelectedIntent] = useState<ExploreIntent>("buy");
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

  const goToExplore = (purpose?: ExploreIntent, typeParam?: string) => {
    const params: Record<string, string> = {};
    if (purpose === "commercial") params.type = "commercial";
    else if (purpose === "plot") params.type = "Industrial Plot";
    else if (purpose) params.purpose = purpose;
    if (typeParam) params.type = typeParam;
    router.push({ pathname: "/(tabs)/explore", params });
  };

  const handleIntentPress = (id: ExploreIntent) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setSelectedIntent(id);
  };

  const intentLabel = INTENTS.find((i) => i.id === selectedIntent)?.label ?? "Buy";

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

          <View style={styles.searchCard}>
            <Text style={styles.searchEyebrow}>What are you looking for?</Text>
            <View style={styles.segment} accessibilityRole="tablist">
              {INTENTS.map(({ id, label, icon: Icon }) => {
                const active = selectedIntent === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => handleIntentPress(id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Browse ${label} properties`}
                    style={({ pressed }) => [
                      styles.segmentItem,
                      active && styles.segmentItemActive,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Icon size={15} color={active ? colors.accent : colors.inkMuted} strokeWidth={active ? 2.5 : 2} />
                    <Text numberOfLines={1} style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => goToExplore(selectedIntent)}
              accessibilityRole="search"
              accessibilityLabel={`Search ${intentLabel.toLowerCase()} properties in ${selectedCity}`}
              style={({ pressed }) => [styles.searchField, pressed && { opacity: 0.8 }]}
            >
              <Search size={18} color={colors.accent} strokeWidth={2} />
              <Text style={styles.searchText}>
                {allIndia
                  ? `Search ${intentLabel.toLowerCase()} across India`
                  : `Search ${intentLabel.toLowerCase()} in ${selectedCity}`}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => goToExplore(selectedIntent)}
              accessibilityRole="button"
              accessibilityLabel={`Explore ${intentLabel} listings`}
              style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.exploreBtnText}>Explore {intentLabel.toLowerCase()} listings</Text>
              <ChevronRight size={16} color={colors.onAccent} />
            </Pressable>
          </View>
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
            <Text style={styles.destinationsSub}>Search homes by market — tap a city to open Explore</Text>
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
                  <Text style={styles.tileTitle} numberOfLines={1}>
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
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    boxShadow: shadow.card,
  },
  searchEyebrow: {
    ...type.label,
    color: colors.inkSecondary,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 38,
    borderRadius: radius.sm,
    borderCurve: "continuous",
  },
  segmentItemActive: { backgroundColor: colors.surface, boxShadow: shadow.card },
  segmentLabel: { ...type.caption, color: colors.inkMuted, fontWeight: "500" },
  segmentLabelActive: { color: colors.ink, fontWeight: "700" },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderCurve: "continuous",
    height: 48,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: { ...type.body, color: colors.inkMuted, flex: 1 },
  exploreBtn: {
    minHeight: 46,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  exploreBtnText: {
    ...type.emphasis,
    color: colors.onAccent,
  },
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
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { ...type.emphasis, color: colors.ink, flexShrink: 1 },
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
