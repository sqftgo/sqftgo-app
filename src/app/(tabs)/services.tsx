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
  ChevronDown,
  Compass,
  MapPin,
  Search,
  X,
} from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpertCard } from "@/components/ui/expert-card";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { ServiceCard } from "@/components/ui/service-card";
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

export default function ServicesTabScreen() {
  const router = useRouter();
  const { selectedCity, directoryProfiles } = useApp();

  const [query, setQuery] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [partners, setPartners] = useState<DirectoryProfile[]>([]);
  const [activeTypeId, setActiveTypeId] = useState<string | "all">("all");
  const [activeCategoryName, setActiveCategoryName] = useState<string | "all">("all");
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
      if (activeCategoryName !== "all" && p.category !== activeCategoryName) {
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
  }, [directoryProfiles, selectedCity, activeCategoryName, query]);

  const filteredPartners = useMemo(() => {
    if (activeTypeId === "all") return partners;
    return partners.filter((p) => p.serviceTypeId === activeTypeId);
  }, [partners, activeTypeId]);

  const handleOpenCategory = (slug: string) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    router.push(`/services/${slug}` as never);
  };

  const listBusinessCta = (
    <Pressable
      onPress={() => router.push("/dealer-register" as Href)}
      style={({ pressed }) => ({
        backgroundColor: colors.accent,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text
        style={{
          ...type.caption,
          fontWeight: "700",
          color: colors.onAccent,
          marginBottom: 4,
        }}
      >
        Are you a local service professional?
      </Text>
      <Text style={{ ...type.body, fontSize: 13, color: "rgba(255,255,255,0.9)" }}>
        List your business with SqftGo — reach relocators in your city.
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          gap: spacing.md,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
        }}
      >
        <ScreenNavbar
          eyebrow="Real estate services for every need"
          title="Everything you need in your city"
          subtitle={`Architects, contractors, interiors & more in ${selectedCity}`}
          rightAction={
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <Pressable onPress={() => router.push("/my-service-bookings" as Href)}>
                <Text style={{ ...type.micro, fontWeight: "700", color: colors.accent }}>
                  My bookings
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCityModalVisible(true)}
                hitSlop={8}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: colors.surface,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs + 3,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  boxShadow: shadow.card,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <MapPin size={13} color={colors.accent} />
                <Text style={{ ...type.caption, fontWeight: "700", color: colors.ink }}>
                  {selectedCity}
                </Text>
                <ChevronDown size={13} color={colors.inkMuted} />
              </Pressable>
            </View>
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
            placeholder="Search partners or categories"
            placeholderTextColor={colors.inkMuted}
            style={{ flex: 1, ...type.body, fontSize: 14, color: colors.ink, padding: 0 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={16} color={colors.inkMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {isApiMode ? (
        <FlatList
          data={filteredPartners}
          keyExtractor={(item) => item.id}
          refreshing={loadingPartners}
          onRefresh={loadPartners}
          ListHeaderComponent={
            <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
              {listBusinessCta}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.xs }}
              >
                <Chip
                  label="All"
                  selected={activeTypeId === "all"}
                  onPress={() => setActiveTypeId("all")}
                />
                {serviceTypes.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.name}
                    selected={activeTypeId === item.id}
                    onPress={() => setActiveTypeId(item.id)}
                  />
                ))}
              </ScrollView>
              <Text style={{ ...type.label, color: colors.inkMuted }}>
                SERVICE PARTNERS IN {selectedCity.toUpperCase()}
              </Text>
              {loadingPartners && partners.length === 0 ? (
                <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
              ) : null}
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            loadingPartners ? null : (
              <EmptyState
                icon={Compass}
                title="No partners found"
                message={`No service partners in ${selectedCity} match your search. Try another city or clear filters.`}
                actionLabel="Change city"
                onAction={() => setCityModalVisible(true)}
              />
            )
          }
          renderItem={({ item }) => <ExpertCard profile={item} />}
        />
      ) : (
        <FlatList
          data={mockCategories}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              {listBusinessCta}
              {mockPartners.length > 0 ? (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: spacing.xs }}
                  >
                    <Chip
                      label="All"
                      selected={activeCategoryName === "all"}
                      onPress={() => setActiveCategoryName("all")}
                    />
                    {REAL_ESTATE_SERVICES.map((item) => (
                      <Chip
                        key={item.id}
                        label={item.title}
                        selected={activeCategoryName === item.title}
                        onPress={() => setActiveCategoryName(item.title)}
                      />
                    ))}
                  </ScrollView>
                  <Text style={{ ...type.label, color: colors.inkMuted }}>
                    PARTNERS NEARBY
                  </Text>
                  {mockPartners.slice(0, 4).map((p) => (
                    <ExpertCard key={p.id} profile={p} />
                  ))}
                  <Text
                    style={{
                      ...type.label,
                      color: colors.inkMuted,
                      marginTop: spacing.sm,
                    }}
                  >
                    CATEGORIES
                  </Text>
                </>
              ) : (
                <Text style={{ ...type.label, color: colors.inkMuted }}>CATEGORIES</Text>
              )}
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              icon={Compass}
              title="No categories found"
              message="Try a different search term."
            />
          }
          renderItem={({ item }) => (
            <ServiceCard service={item} onPress={() => handleOpenCategory(item.slug)} />
          )}
        />
      )}

      <CitySelectionModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
      />
    </SafeAreaView>
  );
}
