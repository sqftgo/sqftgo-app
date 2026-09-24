import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  MapPin,
  Search,
  Store,
  X,
} from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpertCard } from "@/components/ui/expert-card";
import { HeaderPillButton, ScreenNavbar } from "@/components/ui/screen-navbar";
import { SectionHeader } from "@/components/ui/section-header";
import {
  ALL_SERVICES_ICON,
  ServiceCard,
  ServiceTile,
  serviceIconFor,
} from "@/components/ui/service-card";
import { useApp } from "@/context/AppContext";
import { REAL_ESTATE_SERVICES } from "@/data/services";
import type { DirectoryProfile } from "@/data/types";
import { isApiMode } from "@/lib/api/config";
import { isServiceDirectoryCategory } from "@/lib/is-dealer-category";
import {
  apiListServicePartners,
  apiListServiceTypes,
  type ServiceType,
} from "@/lib/api/services/services";
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

function PartnerRail({ partners }: { partners: DirectoryProfile[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -spacing.lg }}
      contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: 4 }}
    >
      {partners.map((p) => (
        <ExpertCard key={p.id} profile={p} variant="compact" />
      ))}
    </ScrollView>
  );
}

export default function ServicesTabScreen() {
  const router = useRouter();
  const { selectedCity, directoryProfiles } = useApp();

  const [query, setQuery] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [partners, setPartners] = useState<DirectoryProfile[]>([]);
  const [activeTypeId, setActiveTypeId] = useState<string | "all">("all");
  const [showAllPartners, setShowAllPartners] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    if (!isApiMode) return;
    apiListServiceTypes()
      .then(setServiceTypes)
      .catch(() => setServiceTypes([]));
  }, []);

  const loadPartners = useCallback(async () => {
    if (!isApiMode) return;
    setLoadingPartners(true);
    try {
      const city =
        selectedCity && selectedCity.toLowerCase() !== "all india"
          ? selectedCity
          : undefined;
      setPartners(
        await apiListServicePartners({
          city,
          search: query.trim() || undefined,
          limit: 60,
        }),
      );
    } catch {
      setPartners([]);
    } finally {
      setLoadingPartners(false);
    }
  }, [selectedCity, query]);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  const mockCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REAL_ESTATE_SERVICES;
    return REAL_ESTATE_SERVICES.filter(
      (srv) =>
        srv.title.toLowerCase().includes(q) ||
        srv.subtitle.toLowerCase().includes(q) ||
        srv.popularServices.some((p) => p.toLowerCase().includes(q)),
    );
  }, [query]);

  const mockPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryProfiles.filter((p) => {
      if (!isServiceDirectoryCategory(p.category)) return false;
      if (
        selectedCity &&
        selectedCity.toLowerCase() !== "all india" &&
        p.city.trim().toLowerCase() !== selectedCity.trim().toLowerCase()
      ) {
        return false;
      }
      if (
        q &&
        !p.firmName.toLowerCase().includes(q) &&
        !p.ownerName.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [directoryProfiles, selectedCity, query]);

  const filteredPartners = useMemo(() => {
    if (activeTypeId === "all") return partners;
    return partners.filter((p) => p.serviceTypeId === activeTypeId);
  }, [partners, activeTypeId]);

  const topRatedPartners = useMemo(
    () => [...partners].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8),
    [partners],
  );

  const handleOpenCategory = (slug: string) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    router.push(`/services/${slug}` as never);
  };

  const handleSelectType = (id: string | "all") => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setActiveTypeId(id);
  };

  const listBusinessBanner = (
    <Pressable
      onPress={() => router.push("/dealer-register" as Href)}
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
        borderStyle: "dashed",
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
          Are you a local service professional?
        </Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          List your business and reach relocators in your city.
        </Text>
      </View>
      <ChevronRight size={16} color={colors.accent} />
    </Pressable>
  );

  const header = (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        paddingBottom: spacing.md,
        paddingTop: spacing.xs,
      }}
    >
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
        actions={[
          {
            icon: Calendar,
            label: "My bookings",
            onPress: () => router.push("/my-service-bookings" as Href),
          },
        ]}
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
          style={{ flex: 1, ...type.body, fontSize: 14, color: colors.ink, padding: 0 }}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
            <X size={16} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  if (isApiMode) {
    const showRail = activeTypeId === "all" && !query.trim() && topRatedPartners.length >= 3;

    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <FlatList
          data={filteredPartners}
          keyExtractor={(item) => item.id}
          refreshing={loadingPartners}
          onRefresh={loadPartners}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: spacing.xl, marginBottom: spacing.xs }}>
              {serviceTypes.length > 0 ? (
                <View style={{ gap: spacing.md }}>
                  <SectionHeader title="Browse by category" />
                  <CategoryGrid>
                    {[
                      <ServiceTile
                        key="all"
                        label="All"
                        icon={ALL_SERVICES_ICON}
                        selected={activeTypeId === "all"}
                        onPress={() => handleSelectType("all")}
                      />,
                      ...serviceTypes.map((item) => (
                        <ServiceTile
                          key={item.id}
                          label={item.name}
                          icon={serviceIconFor(item.icon || item.name)}
                          selected={activeTypeId === item.id}
                          onPress={() => handleSelectType(item.id)}
                        />
                      )),
                    ]}
                  </CategoryGrid>
                </View>
              ) : null}

              {showRail ? (
                <View style={{ gap: spacing.md }}>
                  <SectionHeader title={`Top partners in ${selectedCity}`} />
                  <PartnerRail partners={topRatedPartners} />
                </View>
              ) : null}

              <View style={{ gap: spacing.xs }}>
                <SectionHeader
                  title={
                    activeTypeId === "all"
                      ? "All partners"
                      : serviceTypes.find((t) => t.id === activeTypeId)?.name ?? "Partners"
                  }
                />
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  {filteredPartners.length} verified in {selectedCity}
                </Text>
                {loadingPartners && partners.length === 0 ? (
                  <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
                ) : null}
              </View>
            </View>
          }
          ListFooterComponent={filteredPartners.length > 0 ? listBusinessBanner : null}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xs,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            loadingPartners ? null : (
              <View style={{ gap: spacing.md }}>
                <EmptyState
                  icon={Compass}
                  title="No partners found"
                  message={`No service partners in ${selectedCity} match your search. Try another city or clear filters.`}
                  actionLabel="Change city"
                  onAction={() => setCityModalVisible(true)}
                />
                {listBusinessBanner}
              </View>
            )
          }
          renderItem={({ item }) => <ExpertCard profile={item} />}
        />
        <CitySelectionModal
          visible={cityModalVisible}
          onClose={() => setCityModalVisible(false)}
        />
      </SafeAreaView>
    );
  }

  const nothingFound = mockCategories.length === 0 && mockPartners.length === 0;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xxl,
          gap: spacing.xl,
          flexGrow: 1,
        }}
      >
        {nothingFound ? (
          <EmptyState
            icon={Compass}
            title="Nothing found"
            message="Try a different search term."
          />
        ) : null}

        {mockCategories.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Browse by category" />
            <CategoryGrid>
              {mockCategories.map((item) => (
                <ServiceCard
                  key={item.id}
                  service={item}
                  variant="tile"
                  onPress={() => handleOpenCategory(item.slug)}
                />
              ))}
            </CategoryGrid>
          </View>
        ) : null}

        {mockPartners.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionHeader
              title={`Top partners in ${selectedCity}`}
              actionLabel={mockPartners.length > 1 ? (showAllPartners ? "Show less" : "See all") : undefined}
              onAction={() => setShowAllPartners((v) => !v)}
            />
            {showAllPartners ? (
              <View style={{ gap: spacing.md }}>
                {mockPartners.map((p) => (
                  <ExpertCard key={p.id} profile={p} />
                ))}
              </View>
            ) : (
              <PartnerRail partners={mockPartners.slice(0, 8)} />
            )}
          </View>
        ) : null}

        {listBusinessBanner}
      </ScrollView>

      <CitySelectionModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
      />
    </SafeAreaView>
  );
}
