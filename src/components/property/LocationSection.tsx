import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";

import { MapPin, PlusCircle, Sparkles, Train } from "@/components/ui/icons";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { PropertySection } from "./PropertySection";

const MAP_IMAGE =
  "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&h=400&q=80";

// Nearby landmarks from the dealer listing, with generic fallbacks for older properties.
function nearbyFacilities(property: Property) {
  return [
    {
      id: "hospital",
      name: "Hospital",
      icon: PlusCircle,
      detail: property.nearbyHospital || "Ask the dealer for the nearest hospital",
    },
    {
      id: "school",
      name: "School",
      icon: Sparkles,
      detail: property.nearbySchool || "Ask the dealer for the nearest school",
    },
    {
      id: "transport",
      name: "Transportation",
      icon: Train,
      detail: property.nearbyTransportation || "Ask the dealer for transit access",
    },
  ];
}

export function LocationSection({ property }: { property: Property }) {
  const facilities = nearbyFacilities(property);
  const [selectedId, setSelectedId] = useState(facilities[0].id);
  const selected = facilities.find((f) => f.id === selectedId) ?? facilities[0];

  return (
    <PropertySection title="Location & nearby">
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <MapPin size={15} color={colors.accent} />
        <Text style={{ ...type.body, color: colors.inkSecondary }}>
          {property.locality}, {property.city}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {facilities.map(({ id, name, icon: Icon }) => {
          const active = id === selectedId;
          return (
            <Pressable
              key={id}
              onPress={() => setSelectedId(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accentSoft : colors.surface,
              }}
            >
              <Icon size={15} color={active ? colors.accent : colors.inkSecondary} />
              <Text
                style={{ ...type.label, fontWeight: "600", color: active ? colors.accent : colors.ink }}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={{
          height: 170,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: colors.surfaceSubtle,
        }}
      >
        <Image source={{ uri: MAP_IMAGE }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        <View
          style={{
            position: "absolute",
            left: spacing.md,
            right: spacing.md,
            bottom: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            padding: spacing.sm + 2,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: radius.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accent,
            }}
          >
            <MapPin size={16} color={colors.onAccent} />
          </View>
          <Text style={{ ...type.caption, color: colors.ink, flex: 1 }} numberOfLines={2}>
            {selected.detail}
          </Text>
        </View>
      </View>
    </PropertySection>
  );
}
