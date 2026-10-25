import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState, ListSkeleton, useRequireAuth } from "@/components/ds";
import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { Chip, RemovableFilterChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpertCard } from "@/components/ui/expert-card";
import { Briefcase, MapPin, Search, Store, X } from "@/components/ui/icons";
import { HeaderPillButton, ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import { directoryCategories } from "@/data/directory";
import type { DirectoryCategory, DirectoryProfile } from "@/data/types";
import { isApiMode } from "@/lib/api/config";
import { apiListDealerDirectory } from "@/lib/api/services/dealers";
import { isDealerCategory, isDirectoryVerified } from "@/lib/is-dealer-category";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

type CategoryFilter = DirectoryCategory | "all";

function matchesQuery(p: DirectoryProfile, q: string) {
  return (
    p.firmName.toLowerCase().includes(q) ||
    p.ownerName.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    (p.description ?? "").toLowerCase().includes(q) ||
    (p.specialties ?? []).some((s) => s.toLowerCase().includes(q))
  );
}

export default function DealersDirectoryScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { directoryProfiles, selectedCity, userRole, isLoggedIn } = useApp();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const city = selectedCity && selectedCity.toLowerCase() !== "all india" ? selectedCity : undefined;
  const search = query.trim();
  const categoryLabel =
    category === "all" ? null : directoryCategories.find((c) => c.id === category)?.label ?? category;

  const dealersQuery = useQuery({
    queryKey: ["dealer-directory", city ?? "all", search, category],
    queryFn: () =>
      apiListDealerDirectory({
        city,
        search: search || undefined,
        category: category === "all" ? undefined : category,
        limit: 60,
      }),
    enabled: isApiMode,
  });

  const dealers = useMemo(() => {
    const base = isApiMode
      ? (dealersQuery.data ?? [])
      : directoryProfiles.filter((p) => isDealerCategory(p.category) && p.listingActive !== false);

    let list = base.filter((p) => isDealerCategory(p.category) && p.listingActive !== false);

    // Safety net when the API ignores category / city / search.
    if (city) {
      list = list.filter((p) => p.city.trim().toLowerCase() === city.toLowerCase());
    }
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    const q = search.toLowerCase();
    if (q) list = list.filter((p) => matchesQuery(p, q));

    return [...list].sort(
      (a, b) => Number(isDirectoryVerified(b)) - Number(isDirectoryVerified(a)),
    );
  }, [dealersQuery.data, directoryProfiles, city, category, search]);

  const setCategoryFilter = (next: CategoryFilter) => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setCategory(next);
  };

  const clearFilters = () => {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setCategory("all");
    setQuery("");
  };

  const hasActiveFilters = Boolean(search || category !== "all");
  const loading = isApiMode && dealersQuery.isLoading;

  const emptyMessage = (() => {
    if (search && categoryLabel) {
      return `No ${categoryLabel.toLowerCase()} match “${search}” in ${city ?? "India"}.`;
    }
    if (search) return `No dealers match “${search}” in ${city ?? "India"}.`;
    if (categoryLabel) {
      return `No ${categoryLabel.toLowerCase()} in ${city ?? "India"} yet. Try another category or city.`;
    }
    return `No dealers listed in ${city ?? "India"} yet. Try another city.`;
  })();

  const openRegister = () => {
    if (isLoggedIn) {
      router.push("/dealer-register" as Href);
      return;
    }
    requireAuth("Sign in to register as a dealer on SqftGo.", () => {
      router.push("/dealer-register" as Href);
    });
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
          title="Dealers"
          subtitle={
            loading
              ? `Looking up dealers in ${selectedCity}…`
              : dealers.length === 1
                ? `1 dealer in ${selectedCity}`
                : `${dealers.length} dealers in ${selectedCity}`
          }
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/" as Href))}
          rightAction={
            <HeaderPillButton
              icon={MapPin}
              label={selectedCity}
              dropdown
              accessibilityLabel={`Change city, currently ${selectedCity}`}
              onPress={() => setCityModalVisible(true)}
            />
          }
        />

        <View style={{ gap: spacing.sm }}>
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
              placeholder="Search by name, firm, or specialty"
              placeholderTextColor={colors.inkMuted}
              returnKeyType="search"
              style={{
                flex: 1,
                ...type.body,
                fontSize: 14,
                color: colors.ink,
                padding: 0,
              }}
            />
            {query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <X size={16} color={colors.inkMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }}
          >
            <Chip
              label="All dealers"
              selected={category === "all"}
              onPress={() => setCategoryFilter("all")}
            />
            {directoryCategories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                selected={category === cat.id}
                onPress={() => setCategoryFilter(category === cat.id ? "all" : cat.id)}
              />
            ))}
          </ScrollView>

          {hasActiveFilters ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
            >
              {categoryLabel ? (
                <RemovableFilterChip label={categoryLabel} onRemove={() => setCategoryFilter("all")} />
              ) : null}
              {search ? (
                <RemovableFilterChip label={`“${search}”`} onRemove={() => setQuery("")} />
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>

      <FlatList
        data={loading ? [] : dealers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpertCard profile={item} />}
        refreshing={dealersQuery.isRefetching}
        onRefresh={isApiMode ? () => void dealersQuery.refetch() : undefined}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xxl + spacing.lg,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            {userRole !== "broker" ? (
              <Pressable
                onPress={openRegister}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: colors.accent,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  padding: spacing.md,
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
                  Are you a Real Estate Professional?
                </Text>
                <Text style={{ ...type.body, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                  Grow your business with SqftGo — list properties and get verified.
                </Text>
              </Pressable>
            ) : null}
            {!loading && dealers.length > 0 ? (
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {categoryLabel ? categoryLabel : "All dealers"}
                {" · "}
                verified partners shown first
              </Text>
            ) : null}
            {loading ? <ListSkeleton rows={3} /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : dealersQuery.isError ? (
            <ErrorState onRetry={() => void dealersQuery.refetch()} />
          ) : (
            <EmptyState
              icon={hasActiveFilters ? Briefcase : Store}
              title={hasActiveFilters ? "No matches" : "No dealers found"}
              message={emptyMessage}
              actionLabel={hasActiveFilters ? "Clear filters" : "Change city"}
              onAction={hasActiveFilters ? clearFilters : () => setCityModalVisible(true)}
            />
          )
        }
      />

      <CitySelectionModal visible={cityModalVisible} onClose={() => setCityModalVisible(false)} />
    </SafeAreaView>
  );
}
