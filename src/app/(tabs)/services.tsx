import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
import {
  apiListServicePartners,
  apiListServiceTypes,
  type ServiceType,
} from "@/lib/api/services/services";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function ServicesTabScreen() {
  const router = useRouter();
  const { selectedCity } = useApp();

  const [query, setQuery] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [partners, setPartners] = useState<DirectoryProfile[]>([]);
  const [activeTypeId, setActiveTypeId] = useState<string | "all">("all");
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

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REAL_ESTATE_SERVICES;
    return REAL_ESTATE_SERVICES.filter(
      (srv) =>
        srv.title.toLowerCase().includes(q) ||
        srv.subtitle.toLowerCase().includes(q) ||
        srv.popularServices.some((p) => p.toLowerCase().includes(q)),
    );
  }, [query]);

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
          title="Services"
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
            placeholder={isApiMode ? "Search partners or categories" : "Search service categories"}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
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
              <Text style={{ ...type.label, color: colors.inkMuted }}>SERVICE PARTNERS</Text>
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
              title="No partners found"
              message="Try another city or clear search."
            />
          }
          renderItem={({ item }) => <ExpertCard profile={item} />}
        />
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
          }}
          renderItem={({ item }) => (
            <ServiceCard service={item} onPress={() => handleOpenCategory(item.slug)} />
          )}
        />
      )}

      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
    </SafeAreaView>
  );
}
