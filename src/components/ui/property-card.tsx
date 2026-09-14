import { Bed, Heart, MapPin, Maximize2, ShieldCheck } from "@/components/ui/icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { formatIndianPrice, formatSize, purposeLabel } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";


interface PropertyCardProps {
  property: Property;
  variant?: "full" | "compact";
}

const FALLBACK_IMAGE = {
  uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
};

const FavoriteButton = memo(function FavoriteButton({
  isFav,
  onPress,
}: {
  isFav: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFav ? "Remove from saved" : "Save property"}
      style={({ pressed }) => ({
        boxShadow: shadow.card,
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
      className="w-[34px] h-[34px] rounded-md bg-white items-center justify-center border border-black/5"
    >
      <Heart
        size={16}
        color={isFav ? colors.accent : colors.inkSecondary}
        fill={isFav ? colors.accent : "transparent"}
      />
    </Pressable>
  );
});

function PropertyCardBase({ property, variant = "full" }: PropertyCardProps) {
  const router = useRouter();
  const { favorites, toggleFavorite } = useApp();
  const isFav = favorites.includes(property.id);
  const compact = variant === "compact";

  const handleOpen = useCallback(() => {
    router.push({ pathname: "/property/[id]", params: { id: property.id } });
  }, [router, property.id]);

  const handleFavorite = useCallback(() => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(property.id);
  }, [toggleFavorite, property.id]);

  const priceLabel = useMemo(() => formatIndianPrice(property.price), [property.price]);
  const sizeLabel = useMemo(() => formatSize(property.size), [property.size]);
  const purposeText = useMemo(() => purposeLabel(property.purpose), [property.purpose]);
  const showPerMonth = property.purpose === "rent" || property.purpose === "lease";
  const imageSource = property.images?.[0] ? { uri: property.images[0] } : FALLBACK_IMAGE;

  return (
    <Pressable
      onPress={handleOpen}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${priceLabel}, ${property.locality}`}
      style={({ pressed }) => ({
        width: compact ? 260 : "100%",
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        boxShadow: shadow.card,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {/* Image Container with Floating Badges */}
      <View
        style={{
          width: "100%",
          height: compact ? 144 : 196,
          backgroundColor: colors.surfaceSubtle,
          position: "relative",
        }}
      >
        <Image
          source={imageSource}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={property.id}
        />

        {/* Floating Badges and Save Button */}
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            right: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: "rgba(0, 0, 0, 0.05)",
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.micro, color: colors.ink }}>
                {purposeText}
              </Text>
            </View>

            {property.featured && (
              <View
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.sm,
                }}
              >
                <Text style={{ ...type.micro, color: colors.onAccent }}>
                  Featured
                </Text>
              </View>
            )}
          </View>

          <FavoriteButton isFav={isFav} onPress={handleFavorite} />
        </View>
      </View>

      {/* Card Body */}
      <View style={{ padding: compact ? spacing.md : spacing.lg, gap: 5 }}>
        {/* Price & RERA Verification Tag */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
            <Text style={{ ...type.title, fontSize: 18, color: colors.accent }}>
              {priceLabel}
            </Text>
            {showPerMonth && (
              <Text style={{ ...type.caption, color: colors.inkMuted }}> /mo</Text>
            )}
          </View>

          {property.reraApproved && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: colors.successSoft,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: radius.sm,
              }}
            >
              <ShieldCheck size={12} color={colors.success} strokeWidth={2.5} />
              <Text style={{ ...type.micro, color: colors.success }}>RERA</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          numberOfLines={1}
          style={{ ...type.emphasis, color: colors.ink }}
        >
          {property.title}
        </Text>

        {/* Locality with Pin */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <MapPin size={13} color={colors.inkMuted} />
          <Text
            numberOfLines={1}
            style={{ ...type.caption, color: colors.inkMuted, flex: 1 }}
          >
            {property.locality}, {property.city}
          </Text>
        </View>

        {/* Specs Meta Footer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 2,
            paddingTop: spacing.sm + 2,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {property.bhk != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Bed size={13} color={colors.inkSecondary} />
              <Text style={{ ...type.caption, fontWeight: "500", color: colors.inkSecondary }}>
                {property.bhk} BHK
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Maximize2 size={12} color={colors.inkSecondary} />
            <Text style={{ ...type.caption, fontWeight: "500", color: colors.inkSecondary }}>
              {sizeLabel}
            </Text>
          </View>

          {!compact && property.furnished && (
            <Text
              style={{
                ...type.caption,
                color: colors.inkMuted,
                marginLeft: "auto",
              }}
            >
              {property.furnished}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const PropertyCard = memo(PropertyCardBase);
