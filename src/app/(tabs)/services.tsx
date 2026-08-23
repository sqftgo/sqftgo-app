import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ChevronDown,
  Compass,
  MapPin,
  Search,
  X,
} from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { ServiceCard } from "@/components/ui/service-card";
import { useApp } from "@/context/AppContext";
import { REAL_ESTATE_SERVICES } from "@/data/services";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function ServicesTabScreen() {
  const router = useRouter();
  const { selectedCity } = useApp();

  const [query, setQuery] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REAL_ESTATE_SERVICES;
    return REAL_ESTATE_SERVICES.filter((srv) =>
      srv.title.toLowerCase().includes(q) ||
      srv.subtitle.toLowerCase().includes(q) ||
      srv.popularServices.some((p) => p.toLowerCase().includes(q))
    );
  }, [query]);

  const handleOpenCategory = (slug: string) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    router.push(`/services/${slug}` as never);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Header */}
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm, paddingTop: spacing.xs }}>
        <ScreenNavbar
          title="Services"
          rightAction={
            <Pressable
              onPress={() => setCityModalVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Change location, currently ${selectedCity}`}
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
          }
        />

        {/* Search Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.borderStrong,
            paddingHorizontal: spacing.md,
            height: 44,
            gap: spacing.sm,
            boxShadow: shadow.card,
          }}
        >
          <Search size={17} color={colors.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search services..."
            placeholderTextColor={colors.inkMuted}
            style={{
              flex: 1,
              ...type.body,
              fontSize: 14,
              color: colors.ink,
              padding: 0,
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={16} color={colors.inkMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Services Grid — 2 columns */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <ServiceCard service={item} onPress={() => handleOpenCategory(item.slug)} />
        )}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xxl + spacing.lg,
          gap: spacing.sm,
        }}
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.xl,
              alignItems: "center",
              gap: spacing.sm,
              marginTop: spacing.md,
            }}
          >
            <Compass size={32} color={colors.inkMuted} />
            <Text style={{ ...type.emphasis, color: colors.ink }}>No matching services</Text>
            <Text style={{ ...type.caption, color: colors.inkMuted, textAlign: "center" }}>
              Try another search term or browse all categories.
            </Text>
            <Pressable
              onPress={() => setQuery("")}
              style={{
                marginTop: spacing.xs,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                backgroundColor: colors.accentSoft,
                borderRadius: radius.md,
              }}
            >
              <Text style={{ ...type.label, color: colors.accent, fontWeight: "600" }}>
                Clear Search
              </Text>
            </Pressable>
          </View>
        }
      />

      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
    </SafeAreaView>
  );
}
