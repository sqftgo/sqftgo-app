import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Briefcase,
  ChevronDown,
  MapPin,
  Search,
  X,
} from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpertCard } from "@/components/ui/expert-card";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import { directoryCategories } from "@/data/directory";
import type { DirectoryCategory } from "@/data/types";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

type CategoryFilter = DirectoryCategory | "all";

export default function BrokersDirectoryScreen() {
  const { directoryProfiles, selectedCity } = useApp();

  const [query, setQuery] = useState("");

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Filtered Brokers
  const filteredBrokers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryProfiles.filter((p) => {
      if (
        selectedCity &&
        selectedCity.toLowerCase() !== "all india" &&
        p.city.trim().toLowerCase() !== selectedCity.trim().toLowerCase()
      ) {
        return false;
      }
      if (category !== "all" && p.category !== category) return false;
      if (
        q !== "" &&
        !p.firmName.toLowerCase().includes(q) &&
        !p.ownerName.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q) &&
        !p.specialties?.some((s) => s.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [directoryProfiles, selectedCity, category, query]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header with Title and City Switcher */}
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm, paddingTop: spacing.xs }}>
        <ScreenNavbar
          title="Brokers"
          rightAction={
            <Pressable
              onPress={() => setCityModalVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Change city, currently ${selectedCity}`}
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

        {/* Search & Category Filter Section */}
        <View style={{ gap: spacing.sm }}>
          {/* Quick Search Input */}
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
              height: 46,
              gap: spacing.sm,
              boxShadow: shadow.card,
            }}
          >
            <Search size={17} color={colors.inkMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by advisor name, agency, or locality"
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

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }}
          >
            <Chip
              label="All Specialists"
              selected={category === "all"}
              onPress={() => setCategory("all")}
            />
            {directoryCategories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                selected={category === cat.id}
                onPress={() => setCategory(cat.id)}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredBrokers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpertCard profile={item} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xxl + spacing.lg,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={Briefcase}
            title="No verified experts found"
            message={`No listed brokers or consultants in ${selectedCity} match your criteria.`}
            actionLabel="Show all cities"
            onAction={() => setCityModalVisible(true)}
          />
        }
      />

      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
    </SafeAreaView>
  );
}
