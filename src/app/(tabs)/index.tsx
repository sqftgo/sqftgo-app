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
} from "@/components/ui/icons";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { ExpertCard } from "@/components/ui/expert-card";
import { NotificationsSheet, useNotifications } from "@/components/ui/notifications-sheet";
import { PropertyCard } from "@/components/ui/property-card";

import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { SectionHeader } from "@/components/ui/section-header";
import { useApp } from "@/context/AppContext";
import type { PurposeFilter } from "@/lib/filters";
import { displayNameFromEmail, greetingForHour } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

/** Home shortcuts into Explore */
type ExploreIntent = PurposeFilter | "commercial";

const INTENTS: { id: ExploreIntent; label: string; icon: typeof HomeIcon }[] = [
  { id: "buy", label: "Buy", icon: HomeIcon },
  { id: "rent", label: "Rent", icon: KeyRound },
];

/** Category quick access buttons */
const CATEGORIES = [
  {
    id: "Apartment",
    title: "Apartments",
    subtitle: "Flats & Societies",
    icon: Building,
    typeParam: "Apartment",
    accentBg: "rgba(15, 30, 54, 0.05)",
    iconColor: colors.primary,
  },
  {
    id: "Villa",
    title: "Villas & Homes",
    subtitle: "Independent Living",
    icon: HomeIcon,
    typeParam: "Villa",
    accentBg: "rgba(224, 90, 54, 0.08)",
    iconColor: colors.accent,
  },
  {
    id: "Commercial",
    title: "Commercial",
    subtitle: "Shops & Offices",
    icon: Shop,
    typeParam: "commercial",
    accentBg: "rgba(0, 91, 150, 0.08)",
    iconColor: colors.info,
  },
  {
    id: "Plot",
    title: "Plots & Land",
    subtitle: "Residential & Agri",
    icon: Community,
    typeParam: "Industrial Plot",
    accentBg: "rgba(14, 159, 110, 0.08)",
    iconColor: colors.success,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { properties, favorites, selectedCity, userEmail, userName, profile, directoryProfiles } = useApp();

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<ExploreIntent>("buy");
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const savedCount = favorites.length;

  const firstName = useMemo(() => {
    const raw = (userName || profile?.name || "").trim();
    if (raw && !/^user$/i.test(raw)) return raw.split(/\s+/)[0];
    const fromEmail = displayNameFromEmail(userEmail).split(/\s+/)[0];
    return fromEmail && !/^user$/i.test(fromEmail) ? fromEmail : "there";
  }, [userName, profile?.name, userEmail]);

  const cityProperties = useMemo(() => {
    const active = properties.filter((p) => p.status === "Active");
    if (!selectedCity || selectedCity.toLowerCase() === "all india") {
      return active;
    }
    const matched = active.filter(
      (p) => p.city.trim().toLowerCase() === selectedCity.trim().toLowerCase(),
    );
    return matched.length > 0 ? matched : active;
  }, [properties, selectedCity]);

  const featured = useMemo(
    () => {
      const activeFeatured = properties.filter((p) => p.featured && p.status === "Active");
      return activeFeatured.length > 0 ? activeFeatured : properties.filter((p) => p.status === "Active");
    },
    [properties],
  );

  const cityExperts = useMemo(
    () => {
      if (!selectedCity || selectedCity.toLowerCase() === "all india") {
        return directoryProfiles.slice(0, 2);
      }
      const matched = directoryProfiles.filter(
        (d) => d.city.trim().toLowerCase() === selectedCity.trim().toLowerCase(),
      );
      return (matched.length > 0 ? matched : directoryProfiles).slice(0, 2);
    },
    [directoryProfiles, selectedCity],
  );

  const goToExplore = (purpose?: ExploreIntent, type?: string) => {
    const params: Record<string, string> = {};
    if (purpose) params.purpose = purpose;
    if (type) params.type = type;

    router.push({
      pathname: "/(tabs)/explore",
      params,
    });
  };

  const handleIntentPress = (id: ExploreIntent) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setSelectedIntent(id);
    goToExplore(id);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl + spacing.lg, gap: spacing.xxl }}
      >
        {/* Top Header & Search Hero */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.xs }}>
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <ScreenNavbar
                eyebrow={`${greetingForHour(new Date().getHours())}, ${firstName}`}
                title={selectedCity}
                subtitle="Tap to change location"
                onPressTitle={() => setCityModalVisible(true)}
              />
            </View>

            {/* Header Action Controls: Notifications | Saved */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs + 2,
                marginTop: spacing.md + 10,
              }}
            >
              {/* Notifications Button */}
              <Pressable
                onPress={() => setNotificationsVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={
                  unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
                }
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: shadow.card,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Bell size={18} color={colors.ink} />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 9,
                      right: 10,
                      width: 8,
                      height: 8,
                      borderRadius: radius.full,
                      backgroundColor: colors.accent,
                      borderWidth: 1.5,
                      borderColor: colors.surface,
                    }}
                  />
                )}
              </Pressable>

              {/* Saved Properties Button */}
              <Pressable
                onPress={() => router.push("/saved" as Href)}
                accessibilityRole="button"
                accessibilityLabel={
                  savedCount > 0 ? `Saved properties, ${savedCount} shortlisted` : "Saved properties"
                }
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: shadow.card,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Bookmark
                  size={18}
                  color={savedCount > 0 ? colors.accent : colors.ink}
                  strokeWidth={savedCount > 0 ? 2.5 : 2}
                />
                {savedCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 3,
                      borderWidth: 1.5,
                      borderColor: colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.onAccent,
                        fontSize: 9,
                        fontWeight: "800",
                      }}
                    >
                      {savedCount > 9 ? "9+" : savedCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Search Card Container with Intent Switcher */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
              boxShadow: shadow.card,
            }}
          >
            {/* Intent Segmented Switcher */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.surfaceSubtle,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.xs,
                gap: spacing.xs,
              }}
            >
              {INTENTS.map(({ id, label, icon: Icon }) => {
                const isActive = selectedIntent === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => handleIntentPress(id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Browse ${label} properties`}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: spacing.xs + 2,
                      paddingVertical: spacing.sm + 2,
                      borderRadius: radius.md,
                      borderCurve: "continuous",
                      backgroundColor: isActive ? colors.surface : "transparent",
                      boxShadow: isActive ? shadow.card : undefined,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Icon
                      size={15}
                      color={isActive ? colors.accent : colors.inkMuted}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        ...type.caption,
                        color: isActive ? colors.ink : colors.inkMuted,
                        fontWeight: isActive ? "700" : "500",
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Tap Search Input */}
            <Pressable
              onPress={() => goToExplore(selectedIntent)}
              accessibilityRole="search"
              accessibilityLabel="Search properties"
              style={({ pressed }) => ({
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
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Search size={18} color={colors.accent} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...type.body, fontSize: 14, color: colors.inkMuted }}>
                  Search locality, landmark, or builder...
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Explore Categories Section */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <SectionHeader
            title="Explore by Category"
            actionLabel="All Filters"
            onAction={() => goToExplore()}
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
            }}
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => goToExplore(undefined, cat.typeParam)}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${cat.title}`}
                  style={({ pressed }) => ({
                    flexBasis: "48.5%",
                    flexGrow: 1,
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                    gap: spacing.sm,
                    boxShadow: shadow.card,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.md,
                        backgroundColor: cat.accentBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={20} color={cat.iconColor} strokeWidth={2} />
                    </View>
                    <ChevronRight size={16} color={colors.inkMuted} />
                  </View>

                  <View style={{ gap: 2 }}>
                    <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 14 }}>
                      {cat.title}
                    </Text>
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>
                      {cat.subtitle}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Featured Rail */}
        {featured.length > 0 && (
          <View style={{ gap: spacing.md }}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <SectionHeader
                title="Featured Properties"
                actionLabel="See all"
                onAction={() => goToExplore()}
              />
            </View>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PropertyCard property={item} variant="compact" />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            />
          </View>
        )}

        {/* Post Property Banner CTA */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Pressable
            onPress={() => router.push("/post-property")}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              backgroundColor: colors.primary,
              borderRadius: radius.xl,
              borderCurve: "continuous",
              padding: spacing.lg,
              boxShadow: shadow.raised,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: radius.md,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={22} color={colors.onAccent} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Text style={{ ...type.emphasis, color: colors.surface, fontSize: 15 }}>
                  List Your Property
                </Text>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    paddingHorizontal: spacing.xs + 2,
                    paddingVertical: 1,
                    borderRadius: radius.sm,
                  }}
                >
                  <Text style={{ ...type.micro, color: colors.surface, fontSize: 10 }}>Free</Text>
                </View>
              </View>
              <Text style={{ ...type.caption, color: "rgba(255,255,255,0.75)" }}>
                Zero brokerage & connect with verified genuine buyers
              </Text>
            </View>
            <Building2 size={24} color="rgba(255,255,255,0.35)" />
          </Pressable>
        </View>

        {/* In-City Properties Rail / Feed */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <SectionHeader
            title={selectedCity === "All India" ? "Recent Listings" : `Homes in ${selectedCity}`}
            actionLabel={cityProperties.length > 3 ? "See all" : undefined}
            onAction={cityProperties.length > 3 ? () => goToExplore() : undefined}
          />
          {cityProperties.length > 0 ? (
            <View style={{ gap: spacing.lg }}>
              {cityProperties.slice(0, 4).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.xl,
                borderCurve: "continuous",
                padding: spacing.xl,
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.ink }}>
                No listings in {selectedCity} yet
              </Text>
              <Text style={{ ...type.caption, color: colors.inkMuted, textAlign: "center" }}>
                Try exploring nearby areas or change your city filter.
              </Text>
              <Pressable
                onPress={() => setCityModalVisible(true)}
                style={{
                  marginTop: spacing.xs,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.accentSoft,
                  borderRadius: radius.md,
                }}
              >
                <Text style={{ ...type.label, color: colors.accent, fontWeight: "600" }}>
                  Change Location
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Local Verified Experts */}
        {cityExperts.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            <SectionHeader
              title="Verified Local Experts"
              actionLabel="View all"
              onAction={() => router.push("/services")}
            />
            <View style={{ gap: spacing.md }}>
              {cityExperts.map((expert) => (
                <ExpertCard key={expert.id} profile={expert} />
              ))}
            </View>
          </View>
        )}
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

