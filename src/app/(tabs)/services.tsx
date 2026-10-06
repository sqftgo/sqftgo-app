import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState, ListSkeleton } from "@/components/ds";
import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpertCard } from "@/components/ui/expert-card";
import { Calendar, ChevronDown, ChevronRight, ChevronUp, Compass, MapPin, Search, Store, X } from "@/components/ui/icons";
import { HeaderPillButton, ScreenNavbar } from "@/components/ui/screen-navbar";
import { SectionHeader } from "@/components/ui/section-header";
import { ALL_SERVICES_ICON, ServiceTile, serviceIconFor } from "@/components/ui/service-card";
import { useApp } from "@/context/AppContext";
import type { DirectoryProfile } from "@/data/types";
import { useMyServiceProfile } from "@/hooks/use-my-service-profile";
import { useServiceTypes } from "@/hooks/use-service-types";
import { isApiMode } from "@/lib/api/config";
import { apiListServicePartners } from "@/lib/api/services/services";
import { isServiceDirectoryCategory } from "@/lib/is-dealer-category";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

/** Tiles shown before the grid collapses behind a "More" tile. */
const GRID_PREVIEW = 7;

function CategoryGrid({ children }: { children: React.ReactNode[] }) {
  const [expanded, setExpanded] = useState(false);
  const overflow = children.length > GRID_PREVIEW + 1;
  const visible = overflow && !expanded ? children.slice(0, GRID_PREVIEW) : children;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg, marginHorizontal: -2 }}>
      {visible}
      {overflow ? (
        <ServiceTile
          label={expanded ? "Less" : "More"}
          icon={expanded ? ChevronUp : ChevronDown}
          onPress={() => setExpanded((v) => !v)}
        />
      ) : null}
    </View>
  );
}

function matchesQuery(p: DirectoryProfile, q: string) {
  return (
    p.firmName.toLowerCase().includes(q) ||
    p.ownerName.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    (p.description ?? "").toLowerCase().includes(q) ||
    (p.servicesOffered ?? []).some((s) => s.toLowerCase().includes(q))
  );
}

export default function ServicesTabScreen() {
  const router = useRouter();
  const { selectedCity, directoryProfiles, isLoggedIn } = useApp();
  const { types } = useServiceTypes();
  const myService = useMyServiceProfile();

  const [query, setQuery] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [activeType, setActiveType] = useState<string>("all");

  const city = selectedCity && selectedCity.toLowerCase() !== "all india" ? selectedCity : undefined;
  const search = query.trim();

  const partnersQuery = useQuery({
    queryKey: ["service-partners", city ?? "all", search],
    queryFn: () => apiListServicePartners({ city, search: search || undefined, limit: 60 }),
    enabled: isApiMode,
  });

  const partners = useMemo(() => {
    const base = isApiMode
      ? (partnersQuery.data ?? [])
      : directoryProfiles.filter(
          (p) =>
            isServiceDirectoryCategory(p.category) &&
            p.listingActive !== false &&
            (!city || p.city.trim().toLowerCase() === city.toLowerCase()),
        );
    const q = search.toLowerCase();
    return q && !isApiMode ? base.filter((p) => matchesQuery(p, q)) : base;
  }, [partnersQuery.data, directoryProfiles, city, search]);

  const activeTypeMeta = types.find((t) => t.id === activeType);
  const filteredPartners = useMemo(() => {
    if (!activeTypeMeta) return partners;
    return partners.filter((p) => p.serviceTypeId === activeTypeMeta.id || p.category === activeTypeMeta.name);
  }, [partners, activeTypeMeta]);

  const handleSelectType = (id: string) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setActiveType(id);
  };

  const hasServiceProfile = Boolean(myService.profile);
  const listBusinessBanner = (
    <Pressable
      onPress={() => router.push((hasServiceProfile ? "/services/manage" : "/services/register") as Href)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        marginTop: spacing.sm,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        borderWidth: 1,
        borderStyle: hasServiceProfile ? "solid" : "dashed",
        borderColor: colors.accentBorder,
        backgroundColor: pressed ? colors.accentSoft : colors.surface,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
        }}
      >
        <Store size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...type.emphasis, color: colors.ink }}>
          {hasServiceProfile ? "Manage your service profile" : "Are you a local service professional?"}
        </Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          {hasServiceProfile
            ? "Booking requests, details and verification."
            : "List your business and reach people moving to your city."}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.accent} />
    </Pressable>
  );

  const loading = isApiMode && partnersQuery.isLoading;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md, paddingTop: spacing.xs }}>
        <ScreenNavbar
          title="Services"
          rightAction={
            <HeaderPillButton
              icon={MapPin}
              label={selectedCity}
              dropdown
              accessibilityLabel={`Change city, currently ${selectedCity}`}
              onPress={() => setCityModalVisible(true)}
            />
          }
          actions={
            isLoggedIn
              ? [{ icon: Calendar, label: "My bookings", onPress: () => router.push("/my-service-bookings") }]
              : undefined
          }
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            paddingHorizontal: spacing.md,
            height: 46,
            gap: spacing.sm,
            boxShadow: shadow.card,
          }}
        >
          <Search size={17} color={colors.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search architects, movers, vastu..."
            placeholderTextColor={colors.inkMuted}
            returnKeyType="search"
            style={{ flex: 1, ...type.body, color: colors.ink, padding: 0 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
              <X size={16} color={colors.inkMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={loading ? [] : filteredPartners}
        keyExtractor={(item) => item.id}
        refreshing={partnersQuery.isRefetching}
        onRefresh={isApiMode ? () => void partnersQuery.refetch() : undefined}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.xl, marginBottom: spacing.xs }}>
            {types.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title="Browse by category" />
                <CategoryGrid>
                  {[
                    <ServiceTile
                      key="all"
                      label="All"
                      icon={ALL_SERVICES_ICON}
                      selected={activeType === "all"}
                      onPress={() => handleSelectType("all")}
                    />,
                    ...types.map((t) => (
                      <ServiceTile
                        key={t.id}
                        label={t.name}
                        icon={serviceIconFor(t.icon || t.name)}
                        selected={activeType === t.id}
                        onPress={() => handleSelectType(activeType === t.id ? "all" : t.id)}
                      />
                    )),
                  ]}
                </CategoryGrid>
              </View>
            ) : null}

            <View style={{ gap: spacing.xs }}>
              <SectionHeader title={activeTypeMeta?.name ?? "All partners"} />
              {!loading ? (
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  {filteredPartners.length} {filteredPartners.length === 1 ? "partner" : "partners"} in{" "}
                  {city ?? "India"}
                </Text>
              ) : null}
            </View>
            {loading ? <ListSkeleton rows={3} /> : null}
          </View>
        }
        ListFooterComponent={filteredPartners.length > 0 ? listBusinessBanner : null}
        ListEmptyComponent={
          loading ? null : partnersQuery.isError ? (
            <ErrorState onRetry={() => void partnersQuery.refetch()} />
          ) : (
            <View style={{ gap: spacing.md }}>
              <EmptyState
                icon={Compass}
                title="No partners found"
                message={
                  search || activeTypeMeta
                    ? "Nothing matches yet. Try another category or clear the search."
                    : `No service partners in ${city ?? "India"} yet. Try another city.`
                }
                actionLabel="Change city"
                onAction={() => setCityModalVisible(true)}
              />
              {listBusinessBanner}
            </View>
          )
        }
        renderItem={({ item }) => <ExpertCard profile={item} />}
      />
      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
    </SafeAreaView>
  );
}
