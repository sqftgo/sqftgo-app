import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { memo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ArrowRight, MapPin } from "@/components/ui/icons";
import type { DestinationHub } from "@/data/destinations";
import { colors, radius, spacing, type } from "@/theme/tokens";

export type DestinationCardVariant = "rail" | "grid" | "featured";

function homesLabel(count?: number) {
  if (typeof count !== "number") return "View city";
  if (count <= 0) return "Browse homes";
  return `${count} home${count === 1 ? "" : "s"}`;
}

function DestinationCardBase({
  destination,
  variant = "grid",
  listingCount,
  /** Open Explore for this city instead of the city guide. */
  browseHomes,
}: {
  destination: DestinationHub;
  variant?: DestinationCardVariant;
  listingCount?: number;
  browseHomes?: boolean;
}) {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);
  const featured = variant === "featured";
  const rail = variant === "rail";
  const label = homesLabel(listingCount);

  const onPress = () => {
    if (browseHomes) {
      router.push({
        pathname: "/(tabs)/explore",
        params: { city: destination.name },
      } as Href);
      return;
    }
    router.push(`/destinations/${destination.slug}` as Href);
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${destination.name}. ${label}`}
      style={({ pressed }) => [
        styles.card,
        rail && styles.rail,
        featured && styles.featured,
        variant === "grid" && styles.grid,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.media, featured && styles.mediaFeatured, rail && styles.mediaRail]}>
        {imageFailed ? (
          <View style={styles.mediaFallback}>
            <Text style={styles.mediaFallbackText}>{destination.name.slice(0, 2).toUpperCase()}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: destination.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            onError={() => setImageFailed(true)}
          />
        )}
        <View style={styles.region}>
          <Text style={styles.regionText}>{destination.tag}</Text>
        </View>
      </View>

      <View style={[styles.body, featured && styles.bodyFeatured]}>
        <Text style={[styles.name, featured && styles.nameFeatured]} numberOfLines={1}>
          {destination.name}
        </Text>
        <Text style={styles.nickname} numberOfLines={featured ? 2 : 1}>
          {destination.title}
        </Text>
        {featured ? (
          <Text style={styles.desc} numberOfLines={2}>
            {destination.desc}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.meta}>
            <MapPin size={12} color={colors.inkMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {destination.vibe}
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{label}</Text>
            <ArrowRight size={14} color={colors.accent} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const DestinationCard = memo(DestinationCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  rail: { width: 168 },
  /** Pair with hub FlatList `numColumns={2}` + row gap. */
  grid: { flexGrow: 1, flexBasis: 0, maxWidth: "48.5%" },
  featured: { width: "100%" },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  media: {
    height: 112,
    backgroundColor: colors.primary,
    position: "relative",
  },
  mediaRail: { height: 120 },
  mediaFeatured: { height: 168 },
  mediaFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  mediaFallbackText: { ...type.title, color: colors.onPrimary },
  region: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
  },
  regionText: {
    ...type.micro,
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  body: {
    padding: spacing.md,
    gap: 3,
  },
  bodyFeatured: { padding: spacing.lg, gap: spacing.xs },
  name: { ...type.emphasis, color: colors.ink },
  nameFeatured: { ...type.title, color: colors.ink },
  nickname: { ...type.caption, color: colors.inkMuted },
  desc: { ...type.body, color: colors.inkSecondary, marginTop: 2 },
  footer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: { ...type.caption, color: colors.inkMuted, flex: 1 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ctaText: {
    ...type.label,
    color: colors.accent,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});
