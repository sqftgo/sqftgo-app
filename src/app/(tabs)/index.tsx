import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Building2, ChevronDown, Home as HomeIcon, KeyRound, MapPin, Plus, Search, Store } from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { ExpertCard } from "@/components/ui/expert-card";
import { NotificationsSheet, useNotifications } from "@/components/ui/notifications-sheet";
import { PropertyCard } from "@/components/ui/property-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useApp } from "@/context/AppContext";
import { displayNameFromEmail, greetingForHour } from "@/lib/format";
import type { PurposeFilter } from "@/lib/filters";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const INTENTS: { id: PurposeFilter; label: string; icon: typeof HomeIcon }[] = [
  { id: "buy", label: "Buy", icon: HomeIcon },
  { id: "rent", label: "Rent", icon: KeyRound },
  { id: "commercial", label: "Commercial", icon: Store },
];

export default function HomeScreen() {
  const router = useRouter();
  const { properties, selectedCity, userEmail, directoryProfiles } = useApp();

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const cityProperties = useMemo(
    () => properties.filter((p) => p.city === selectedCity && p.status === "Active"),
    [properties, selectedCity],
  );
  const featured = useMemo(
    () => properties.filter((p) => p.featured && p.status === "Active"),
    [properties],
  );
  const cityExperts = useMemo(
    () => directoryProfiles.filter((d) => d.city === selectedCity).slice(0, 2),
    [directoryProfiles, selectedCity],
  );

  const goToExplore = (purpose?: PurposeFilter) => {
    router.push(purpose ? { pathname: "/(tabs)/explore", params: { purpose } } : "/(tabs)/explore");
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.xl }}
      >
        {/* Header: greeting, city, notifications */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
          }}
        >
          <View style={{ gap: spacing.xs, flex: 1 }}>
            <Text style={{ ...type.caption, color: colors.inkMuted }}>
              {greetingForHour(new Date().getHours())},{" "}
              {displayNameFromEmail(userEmail).split(" ")[0]}
            </Text>
            <Pressable
              onPress={() => setCityModalVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Change city, currently ${selectedCity}`}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
            >
              <MapPin size={16} color={colors.accent} />
              <Text style={{ ...type.title, color: colors.ink }}>{selectedCity}</Text>
              <ChevronDown size={16} color={colors.inkMuted} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => setNotificationsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
            }
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Bell size={18} color={colors.ink} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 9,
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
        </View>

        {/* Search hand-off to Explore */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Pressable
            onPress={() => goToExplore()}
            accessibilityRole="search"
            accessibilityLabel="Search properties"
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              borderCurve: "continuous",
              height: 46,
              paddingHorizontal: spacing.md,
              opacity: pressed ? 0.7 : 1,
              boxShadow: shadow.card,
            })}
          >
            <Search size={16} color={colors.inkMuted} />
            <Text style={{ ...type.body, lineHeight: undefined, color: colors.inkMuted }}>
              Search by locality, project, or type
            </Text>
          </Pressable>
        </View>

        {/* Intent shortcuts */}
        <View style={{ flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl }}>
          {INTENTS.map(({ id, label, icon: Icon }) => (
            <Pressable
              key={id}
              onPress={() => goToExplore(id)}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${label} properties`}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                gap: spacing.sm,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                paddingVertical: spacing.lg,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: radius.full,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color={colors.accent} />
              </View>
              <Text style={{ ...type.label, color: colors.ink }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Featured rail */}
        {featured.length > 0 && (
          <View style={{ gap: spacing.lg }}>
            <View style={{ paddingHorizontal: spacing.xl }}>
              <SectionHeader
                title="Featured homes"
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
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
            />
          </View>
        )}

        {/* Post property CTA */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Pressable
            onPress={() => router.push("/post-property")}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.lg,
              backgroundColor: colors.ink,
              borderRadius: radius.xl,
              borderCurve: "continuous",
              padding: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.full,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} color={colors.onAccent} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.surface }}>Post your property</Text>
              <Text style={{ ...type.caption, color: "rgba(255,255,255,0.72)" }}>
                List for free and reach verified buyers
              </Text>
            </View>
            <Building2 size={22} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>

        {/* In-city listings */}
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
          <SectionHeader
            title={`Homes in ${selectedCity}`}
            actionLabel={cityProperties.length > 3 ? "See all" : undefined}
            onAction={cityProperties.length > 3 ? () => goToExplore() : undefined}
          />
          {cityProperties.length > 0 ? (
            <View style={{ gap: spacing.lg }}>
              {cityProperties.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.xl,
                gap: spacing.sm,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.ink }}>
                No listings in {selectedCity} yet
              </Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                Try a nearby city, or browse featured homes above.
              </Text>
              <Pressable onPress={() => setCityModalVisible(true)} hitSlop={8}>
                <Text style={{ ...type.label, color: colors.accent }}>Change city</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Local experts */}
        {cityExperts.length > 0 && (
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
            <SectionHeader
              title="Local experts"
              actionLabel="See all"
              onAction={() => router.push("/(tabs)/services")}
            />
            <View style={{ gap: spacing.md }}>
              {cityExperts.map((profile) => (
                <ExpertCard key={profile.id} profile={profile} />
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
