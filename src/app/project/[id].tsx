import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { ErrorState } from "@/components/ds/ErrorState";
import { Screen } from "@/components/ds/Screen";
import { Skeleton } from "@/components/ds/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Phone } from "@/components/ui/icons";
import type { Project } from "@/data/project";
import { apiGetProject } from "@/lib/api/services/projects";
import { userFacingError } from "@/lib/errors";
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
      setError(userFacingError(e, "This project may be pending review."));
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
      <Screen title="Project" fallbackHref={"/projects" as Href}>
        <Skeleton height={220} rounded={radius.lg} />
        <Skeleton height={28} width="70%" />
        <Skeleton height={18} width="45%" />
        <Skeleton height={80} />
        <Skeleton height={48} />
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen title="Project" fallbackHref={"/projects" as Href}>
        {error ? (
          <ErrorState title="Project unavailable" message={error} onRetry={() => void load()} />
        ) : (
          <EmptyState
            icon={Building2}
            title="Project unavailable"
            message="This project may be pending review."
            actionLabel="Browse projects"
            onAction={() => router.replace("/projects" as Href)}
          />
        )}
      </Screen>
    );
  }

  const cover = project.images?.[0];
  const priceLabel =
    project.priceFrom != null || project.priceTo != null
      ? `${formatPriceWithPeriod(project.priceFrom ?? project.priceTo ?? 0, "buy")}${
          project.priceTo != null && project.priceFrom != null
            ? ` – ${formatPriceWithPeriod(project.priceTo, "buy")}`
            : ""
        }`
      : "Price on request";

  return (
    <Screen title={project.title} fallbackHref={"/projects" as Href}>
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={styles.cover}
          contentFit="cover"
          accessibilityLabel={`${project.title} cover photo`}
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Building2 size={36} color={colors.inkMuted} />
        </View>
      )}

      <View style={styles.metaBlock}>
        <Text style={styles.meta}>
          {project.locality}, {project.city} · {project.lifecycle} · {project.ownershipRole}
        </Text>
        <Text style={styles.price}>{priceLabel}</Text>
        <Text style={styles.description}>{project.description}</Text>
      </View>

      {project.configurations?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Configurations</Text>
          <Text style={styles.sectionBody}>{project.configurations.join(" · ")}</Text>
        </View>
      ) : null}

      {project.amenities?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Amenities</Text>
          <Text style={styles.sectionBody}>{project.amenities.join(" · ")}</Text>
        </View>
      ) : null}

      <View style={styles.contactCard}>
        <Text style={styles.contactName}>{project.contactName}</Text>
        <Button
          label={project.contactPhone}
          icon={Phone}
          variant="tertiary"
          size="md"
          onPress={() => Linking.openURL(`tel:${project.contactPhone.replace(/\s/g, "")}`)}
          style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}
        />
      </View>

      <Button
        label={`Browse listings in ${project.city}`}
        onPress={() => router.push("/(tabs)/explore" as Href)}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: "100%",
    height: 220,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
  },
  coverPlaceholder: {
    height: 180,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  metaBlock: { gap: spacing.sm },
  meta: { ...type.caption, color: colors.inkMuted },
  price: { ...type.heading, color: colors.accent },
  description: { ...type.body, color: colors.inkSecondary, lineHeight: 22 },
  section: { gap: spacing.xs },
  sectionLabel: { ...type.label, color: colors.inkMuted },
  sectionBody: { ...type.body, color: colors.ink },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    boxShadow: shadow.card,
  },
  contactName: { ...type.emphasis, color: colors.ink },
});
