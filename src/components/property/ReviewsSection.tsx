import React from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";

import { appAlert } from "@/components/ui/app-alert";
import { Star } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { PropertySection } from "./PropertySection";

const LOCALITY_REVIEWS = [
  {
    id: "rev-1",
    authorName: "Rajesh Vyas",
    role: "Resident Broker",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    comment: "Excellent connectivity, close to main markets. The water supply is available 24/7. Highly recommended for families.",
  },
  {
    id: "rev-2",
    authorName: "Sonia Verma",
    role: "Home Owner",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    comment: "Lived here for 3 years. It is highly secure and peaceful at night. Local metro station is only 1.2 km away.",
  },
  {
    id: "rev-3",
    authorName: "Amit Mehra",
    role: "Resident",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 4,
    comment: "Very safe gated township. Daily needs bazaars are at walking distance. No issues with power outages.",
  },
];

export function ReviewsSection() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(width * 0.74);

  return (
    <PropertySection
      title="Neighbourhood reviews"
      actionLabel="See all"
      onAction={() => appAlert("Reviews", "Showing all neighborhood feedback")}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + spacing.md}
        decelerationRate="fast"
        style={{ marginHorizontal: -spacing.xl }}
        contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl }}
      >
        {LOCALITY_REVIEWS.map((rev) => (
          <View
            key={rev.id}
            style={{
              width: cardWidth,
              padding: spacing.lg,
              gap: spacing.sm,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Image
                source={{ uri: rev.avatar }}
                style={{ width: 36, height: 36, borderRadius: radius.full }}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ ...type.emphasis, color: colors.ink }}>{rev.authorName}</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>{rev.role}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Star size={13} color={colors.star} fill={colors.star} />
                <Text style={{ ...type.emphasis, color: colors.ink }}>{rev.rating}.0</Text>
              </View>
            </View>
            <Text style={{ ...type.body, color: colors.inkSecondary }} numberOfLines={3}>
              {rev.comment}
            </Text>
          </View>
        ))}
      </ScrollView>
    </PropertySection>
  );
}
