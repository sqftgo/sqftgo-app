import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRequireAuth } from "@/components/ds/AuthGate";
import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { ExpertCard } from "@/components/ui/expert-card";
import {
  Bell,
  Bookmark,
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
  WifiOff,
} from "@/components/ui/icons";
import { NotificationsSheet, useNotifications } from "@/components/ui/notifications-sheet";
import { ProjectCard } from "@/components/ui/project-card";
import { PropertyCard } from "@/components/ui/property-card";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { SectionHeader } from "@/components/ui/section-header";
import { useApp } from "@/context/AppContext";
import { apiListProjects } from "@/lib/api/services/projects";
import type { PurposeFilter } from "@/lib/filters";
import { displayNameFromEmail, greetingForHour } from "@/lib/format";
import { isDealerCategory } from "@/lib/is-dealer-category";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

type ExploreIntent = PurposeFilter | "commercial" | "plot";

const INTENTS: { id: ExploreIntent; label: string; icon: typeof HomeIcon }[] = [
  { id: "buy", label: "Buy", icon: HomeIcon },
  { id: "rent", label: "Rent", icon: KeyRound },
  { id: "plot", label: "Plots", icon: Community },
  { id: "commercial", label: "Commercial", icon: Shop },
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
    favorites,
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
    goToExplore(id);
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
              { icon: Bookmark, label: "Saved properties", badge: favorites.length, onPress: () => router.push("/saved" as Href) },
            ]}
          />

          <View style={styles.searchCard}>
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
                    style={({ pressed }) => [styles.segmentItem, active && styles.segmentItemActive, pressed && { opacity: 0.8 }]}
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
              accessibilityLabel="Search properties"
              style={({ pressed }) => [styles.searchPill, pressed && { opacity: 0.8 }]}
            >
              <Search size={18} color={colors.accent} strokeWidth={2} />
              <Text style={styles.searchText}>Search locality, landmark or builder</Text>
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
            <View style={styles.pad}>
              <View style={styles.emptyCard} accessibilityLiveRegion="polite">
                <WifiOff size={22} color={colors.inkMuted} />
                <Text style={styles.emptyTitle}>Couldn&apos;t load listings</Text>
                <Text style={styles.emptyText}>Check your connection and try again.</Text>
                <Pressable onPress={onRefresh} hitSlop={8} accessibilityRole="button" style={{ marginTop: spacing.xs }}>
                  <Text style={styles.link}>{refreshing ? "Retrying…" : "Try again"}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.pad]}>
              <View style={styles.emptyCard}>
                <MapPin size={22} color={colors.inkMuted} />
                <Text style={styles.emptyTitle}>No listings in {selectedCity} yet</Text>
                <Text style={styles.emptyText}>Try another city, or be the first to list here.</Text>
                <View style={{ flexDirection: "row", gap: spacing.lg, marginTop: spacing.xs }}>
                  <Pressable onPress={() => setCityModalVisible(true)} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.link}>Change city</Text>
                  </Pressable>
                  <Pressable onPress={listProperty} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.link}>List a property</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
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
          <Pressable
            onPress={() => router.push("/destinations" as Href)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.rowLink, pressed && { opacity: 0.85 }]}
          >
            <MapPin size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tileTitle}>Heritage destinations</Text>
              <Text style={styles.emptyText}>City guides and wedding venues</Text>
            </View>
            <ChevronRight size={16} color={colors.inkMuted} />
          </Pressable>
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
              <Text style={styles.sellText}>Reach buyers and tenants in {allIndia ? "your city" : selectedCity}</Text>
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
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
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
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  segmentItemActive: { backgroundColor: colors.surface, boxShadow: shadow.card },
  segmentLabel: { ...type.caption, color: colors.inkMuted, fontWeight: "500" },
  segmentLabelActive: { color: colors.ink, fontWeight: "700" },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    height: 48,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: { ...type.body, color: colors.inkMuted, flex: 1 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: { ...type.emphasis, color: colors.ink, textAlign: "center" },
  emptyText: { ...type.caption, color: colors.inkMuted },
  link: { ...type.label, fontFamily: "Inter_600SemiBold", fontWeight: "600", color: colors.accent },
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
  tileIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  tileTitle: { ...type.emphasis, color: colors.ink, flexShrink: 1 },
  rowLink: {
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
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sellTitle: { ...type.emphasis, color: colors.onPrimary },
  sellText: { ...type.caption, color: colors.onPrimaryMuted },
});
