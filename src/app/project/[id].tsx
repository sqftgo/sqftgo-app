import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { ErrorState } from "@/components/ds/ErrorState";
import { Screen } from "@/components/ds/Screen";
import { Skeleton } from "@/components/ds/Skeleton";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, MessageSquare, Phone, Share2 } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { Project } from "@/data/project";
import { apiGetProject } from "@/lib/api/services/projects";
import { userFacingError } from "@/lib/errors";
import { formatPriceWithPeriod } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function digits(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { setSelectedCity } = useApp();
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
  const phone = project.contactPhone?.replace(/\s/g, "") ?? "";
  const hasPhone = Boolean(phone);

  const openWhatsApp = () => {
    if (!hasPhone) return;
    const text = encodeURIComponent(
      `Namaste, I'm interested in your project "${project.title}" in ${project.locality}, ${project.city}.`,
    );
    const number = digits(phone).replace(/^\+/, "");
    Linking.openURL(`whatsapp://send?phone=${number}&text=${text}`).catch(() =>
      Linking.openURL(`https://wa.me/${number}?text=${text}`).catch(() =>
        appAlert("Can't open WhatsApp", "Install WhatsApp or call the contact instead."),
      ),
    );
  };

  const shareProject = async () => {
    try {
      await Share.share({
        message: `${project.title} — ${project.locality}, ${project.city}`,
        title: project.title,
      });
    } catch {
      // user dismissed
    }
  };

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

      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={styles.meta}>
            {project.locality}, {project.city} · {project.lifecycle} · {project.ownershipRole}
          </Text>
          <Text style={styles.price}>{priceLabel}</Text>
        </View>
        <Pressable
          onPress={shareProject}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share project"
          style={styles.shareBtn}
        >
          <Share2 size={16} color={colors.accent} />
          <Text style={{ ...type.label, color: colors.accent }}>Share</Text>
        </Pressable>
      </View>

      <Text style={styles.description}>{project.description}</Text>

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
        {hasPhone ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
            <Button
              label={project.contactPhone}
              icon={Phone}
              variant="tertiary"
              size="md"
              onPress={() => Linking.openURL(`tel:${phone}`)}
              style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}
            />
            <Button
              label="WhatsApp"
              icon={MessageSquare}
              variant="secondary"
              size="md"
              onPress={openWhatsApp}
            />
          </View>
        ) : null}
      </View>

      <Button
        label={`Browse listings in ${project.city}`}
        onPress={() => {
          if (project.city) setSelectedCity(project.city);
          router.push({
            pathname: "/(tabs)/explore",
            params: { purpose: "buy" },
          } as Href);
        }}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
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
