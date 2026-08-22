import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Briefcase, ChevronLeft, MapPin, ChevronDown } from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpertCard } from "@/components/ui/expert-card";
import { SearchBar } from "@/components/ui/search-bar";
import { directoryCategories } from "@/data/directory";
import type { DirectoryCategory } from "@/data/types";
import { useApp } from "@/context/AppContext";
import { colors, spacing, type } from "@/theme/tokens";

type CategoryFilter = DirectoryCategory | "all";

export default function ServicesScreen() {
  const router = useRouter();
  const { directoryProfiles, selectedCity } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryProfiles.filter((p) => {
      if (p.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (category !== "all" && p.category !== category) return false;
      if (
        q !== "" &&
        !p.firmName.toLowerCase().includes(q) &&
        !p.ownerName.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [directoryProfiles, selectedCity, category, query]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={colors.ink} />
            </Pressable>
            <Text style={{ ...type.title, color: colors.ink }}>Services</Text>
          </View>
          <Pressable
            onPress={() => setCityModalVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Change city, currently ${selectedCity}`}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
          >
            <MapPin size={14} color={colors.accent} />
            <Text style={{ ...type.label, color: colors.ink }}>{selectedCity}</Text>
            <ChevronDown size={14} color={colors.inkMuted} />
          </Pressable>
        </View>

        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Certified brokers, consultants, and home-service partners near you.
        </Text>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search firms or specialists"
        />
      </View>

      <View style={{ marginTop: spacing.md }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: spacing.sm,
          }}
        >
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

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpertCard profile={item} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
        }}
        ListHeaderComponent={
          <Text style={{ ...type.caption, color: colors.inkMuted, marginBottom: spacing.sm }}>
            {results.length === 1 ? "1 professional" : `${results.length} professionals`}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon={Briefcase}
            title="No professionals found"
            message={
              query || category !== "all"
                ? `Nothing in ${selectedCity} matches your search. Try another category.`
                : `We don't have partners listed in ${selectedCity} yet. Try a nearby city.`
            }
            actionLabel={query || category !== "all" ? "Clear filters" : "Change city"}
            onAction={() => {
              if (query || category !== "all") {
                setQuery("");
                setCategory("all");
              } else {
                setCityModalVisible(true);
              }
            }}
          />
        }
      />

      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
    </SafeAreaView>
  );
}
