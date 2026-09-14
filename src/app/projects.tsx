import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2 } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import type { Project } from "@/data/project";
import { isApiMode } from "@/lib/api/config";
import { apiListProjects } from "@/lib/api/services/projects";
import { formatPriceWithPeriod } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function formatRange(from?: number, to?: number) {
  if (from == null && to == null) return "Price on request";
  if (from != null && to != null) {
    return `${formatPriceWithPeriod(from, "buy")} – ${formatPriceWithPeriod(to, "buy")}`;
  }
  return formatPriceWithPeriod(from ?? to ?? 0, "buy");
}

export default function ProjectsBrowseScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!isApiMode) {
        setItems([]);
        return;
      }
      const list = await apiListProjects({ limit: 50 });
      setItems(list.filter((p) => p.status === "Active" || !p.status));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xs }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
        </Pressable>
        <ScreenNavbar title="Projects" subtitle="Builder & developer launches" />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            flexGrow: 1,
            paddingBottom: spacing.xxl,
          }}
          ListEmptyComponent={
            <EmptyState
              icon={Building2}
              title={isApiMode ? "No active projects" : "API mode required"}
              message={
                isApiMode
                  ? "Check back soon for new launches."
                  : "Set EXPO_PUBLIC_API_URL to load live projects."
              }
            />
          }
          renderItem={({ item }) => {
            const cover = item.images?.[0];
            return (
              <Pressable
                onPress={() => router.push(`/project/${item.id}` as Href)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                  boxShadow: shadow.card,
                }}
              >
                {cover ? (
                  <Image source={{ uri: cover }} style={{ width: "100%", height: 160 }} />
                ) : (
                  <View
                    style={{
                      height: 120,
                      backgroundColor: colors.surfaceSubtle,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building2 size={28} color={colors.inkMuted} />
                  </View>
                )}
                <View style={{ padding: spacing.md, gap: 4 }}>
                  <Text style={{ ...type.emphasis, color: colors.ink }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>
                    {item.locality}, {item.city} · {item.lifecycle}
                  </Text>
                  <Text style={{ ...type.label, color: colors.accent }}>
                    {formatRange(item.priceFrom, item.priceTo)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
