import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Bed, Heart, MapPin, Maximize2, ShieldCheck } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { formatIndianPrice, formatSize, purposeLabel } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

interface PropertyCardProps {
  property: Property;
  /** "full" is the default vertical card; "compact" is a fixed-width horizontal-rail card. */
  variant?: "full" | "compact";
}

/**
 * The single property card used everywhere a listing appears
 * (Home, Explore, Favorites). One design, two sizes.
 */
export function PropertyCard({ property, variant = "full" }: PropertyCardProps) {
  const router = useRouter();
  const { favorites, toggleFavorite } = useApp();
  const isFav = favorites.includes(property.id);
  const compact = variant === "compact";

  const handleOpen = () => {
    router.push({ pathname: "/property/[id]", params: { id: property.id } });
  };

  const handleFavorite = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(property.id);
  };

  return (
    <Pressable
      onPress={handleOpen}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${formatIndianPrice(property.price)}, ${property.locality}`}
      style={({ pressed }) => ({
        width: compact ? 240 : undefined,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        boxShadow: shadow.card,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View style={{ height: compact ? 128 : 180, backgroundColor: colors.surfaceSubtle }}>
        <Image
          source={{ uri: property.images[0] }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />

        <View
          style={{
            position: "absolute",
            top: spacing.md,
            left: spacing.md,
            right: spacing.md,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.sm,
              borderCurve: "continuous",
            }}
          >
            <Text style={{ ...type.micro, color: colors.ink }}>
              {purposeLabel(property.purpose)}
            </Text>
          </View>

          <Pressable
            onPress={handleFavorite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isFav ? "Remove from saved" : "Save property"}
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadow.card,
            }}
          >
            <Heart
              size={15}
              color={isFav ? colors.accent : colors.inkMuted}
              fill={isFav ? colors.accent : "transparent"}
            />
          </Pressable>
        </View>
      </View>

      <View style={{ padding: compact ? spacing.md : spacing.lg, gap: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={{ ...type.heading, color: colors.accent }}>
            {formatIndianPrice(property.price)}
            {(property.purpose === "rent" || property.purpose === "lease") && (
              <Text style={{ ...type.caption, color: colors.inkMuted }}> /mo</Text>
            )}
          </Text>
          {property.reraApproved && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor: colors.successSoft,
                paddingHorizontal: spacing.sm - 2,
                paddingVertical: 2,
                borderRadius: radius.sm,
                borderCurve: "continuous",
              }}
            >
              <ShieldCheck size={11} color={colors.success} />
              <Text style={{ ...type.micro, color: colors.success }}>RERA</Text>
            </View>
          )}
        </View>

        <Text numberOfLines={1} style={{ ...type.emphasis, color: colors.ink }}>
          {property.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <MapPin size={12} color={colors.inkMuted} />
          <Text numberOfLines={1} style={{ ...type.caption, color: colors.inkMuted, flex: 1 }}>
            {property.locality}, {property.city}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            marginTop: spacing.xs,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {property.bhk != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Bed size={13} color={colors.inkMuted} />
              <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                {property.bhk} BHK
              </Text>
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Maximize2 size={12} color={colors.inkMuted} />
            <Text style={{ ...type.caption, color: colors.inkSecondary }}>
              {formatSize(property.size)}
            </Text>
          </View>
          {!compact && (
            <Text style={{ ...type.caption, color: colors.inkSecondary }}>
              {property.furnished}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
