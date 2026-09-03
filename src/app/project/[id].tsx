import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2, Phone } from "@/components/ui/icons";
import { Linking } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import type { Project } from "@/data/project";
import { apiGetProject } from "@/lib/api/services/projects";
import { formatPriceWithPeriod } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setProject(await apiGetProject(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project not found");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={Building2}
          title="Project unavailable"
          message={error ?? "This project may be pending review."}
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const cover = project.images?.[0];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: "100%", height: 240 }} />
        ) : (
          <View style={{ height: 180, backgroundColor: colors.surfaceSubtle, alignItems: "center", justifyContent: "center" }}>
            <Building2 size={36} color={colors.inkMuted} />
          </View>
        )}

        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
          </Pressable>
          <Text style={{ ...type.title, color: colors.ink }}>{project.title}</Text>
          <Text style={{ ...type.caption, color: colors.inkMuted }}>
            {project.locality}, {project.city} · {project.lifecycle} · {project.ownershipRole}
          </Text>
          <Text style={{ ...type.heading, color: colors.accent }}>
            {project.priceFrom != null || project.priceTo != null
              ? `${formatPriceWithPeriod(project.priceFrom ?? project.priceTo ?? 0, "buy")}${
                  project.priceTo != null && project.priceFrom != null
                    ? ` – ${formatPriceWithPeriod(project.priceTo, "buy")}`
                    : ""
                }`
              : "Price on request"}
          </Text>
          <Text style={{ ...type.body, color: colors.inkSecondary, lineHeight: 22 }}>
            {project.description}
          </Text>

          {project.configurations?.length ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>CONFIGURATIONS</Text>
              <Text style={{ ...type.body, color: colors.ink }}>
                {project.configurations.join(" · ")}
              </Text>
            </View>
          ) : null}

          {project.amenities?.length ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>AMENITIES</Text>
              <Text style={{ ...type.body, color: colors.ink }}>
                {project.amenities.join(" · ")}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              marginTop: spacing.sm,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              gap: spacing.sm,
              boxShadow: shadow.card,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>{project.contactName}</Text>
            <Pressable
              onPress={() => Linking.openURL(`tel:${project.contactPhone.replace(/\s/g, "")}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
            >
              <Phone size={16} color={colors.accent} />
              <Text style={{ ...type.body, color: colors.accent }}>{project.contactPhone}</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/explore" as Href)}
            style={{
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>Browse listings in {project.city}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
