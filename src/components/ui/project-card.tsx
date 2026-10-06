import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Building2 } from "@/components/ui/icons";
import type { Project } from "@/data/project";
import { formatIndianPrice } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export function formatProjectPriceRange(from?: number, to?: number) {
  if (from == null && to == null) return "Price on request";
  if (from != null && to != null && to !== from) return `${formatIndianPrice(from)} – ${formatIndianPrice(to)}`;
  return formatIndianPrice(from ?? to ?? 0);
}

function ProjectCardBase({ project, variant = "full" }: { project: Project; variant?: "full" | "compact" }) {
  const router = useRouter();
  const cover = project.images?.[0];
  const compact = variant === "compact";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/project/[id]", params: { id: project.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${project.title}, ${project.locality}, ${project.city}`}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={{ width: "100%", height: compact ? 130 : 170 }} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.placeholder, { height: compact ? 130 : 140 }]}>
          <Building2 size={28} color={colors.inkMuted} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
          {project.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[project.locality, project.city].filter(Boolean).join(", ")}
          {project.lifecycle ? ` · ${project.lifecycle}` : ""}
        </Text>
        <Text style={styles.price} numberOfLines={1}>
          {formatProjectPriceRange(project.priceFrom, project.priceTo)}
        </Text>
      </View>
    </Pressable>
  );
}

export const ProjectCard = memo(ProjectCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    boxShadow: shadow.card,
  },
  compact: { width: 240 },
  pressed: { opacity: 0.92 },
  placeholder: { backgroundColor: colors.surfaceSubtle, alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.md, gap: 4 },
  title: { ...type.emphasis, color: colors.ink },
  meta: { ...type.caption, color: colors.inkMuted },
  price: { ...type.label, fontFamily: "Inter_600SemiBold", fontWeight: "600", color: colors.accent, fontVariant: ["tabular-nums"] },
});
