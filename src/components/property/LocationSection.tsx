import React from "react";
import { Linking, Platform, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { MapPin, PlusCircle, Sparkles, Train, type IconComponent } from "@/components/ui/icons";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { PropertySection } from "./PropertySection";

function openInMaps(property: Property) {
  const query = encodeURIComponent(
    [property.locality, property.city, property.state ?? "Rajasthan", property.country ?? "India"]
      .filter(Boolean)
      .join(", "),
  );
  const native = Platform.OS === "ios" ? `maps:0,0?q=${query}` : `geo:0,0?q=${query}`;
  Linking.openURL(native).catch(() =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`),
  );
}

export function LocationSection({ property }: { property: Property }) {
  const landmarks: { label: string; detail: string; icon: IconComponent }[] = [
    property.nearbyHospital ? { label: "Hospital", detail: property.nearbyHospital, icon: PlusCircle } : null,
    property.nearbySchool ? { label: "School", detail: property.nearbySchool, icon: Sparkles } : null,
    property.nearbyTransportation
      ? { label: "Transport", detail: property.nearbyTransportation, icon: Train }
      : null,
  ].filter((x): x is { label: string; detail: string; icon: IconComponent } => x !== null);

  return (
    <PropertySection title="Location">
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
        <MapPin size={18} color={colors.accent} />
        <Text style={{ ...type.body, color: colors.ink, flex: 1 }} selectable>
          {[property.locality, property.city, property.state].filter(Boolean).join(", ")}
        </Text>
      </View>

      {landmarks.length > 0 ? (
        <View
          style={{
            borderRadius: radius.lg,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {landmarks.map(({ label, detail, icon: Icon }, i) => (
            <View
              key={label}
              style={{
                flexDirection: "row",
                gap: spacing.md,
                padding: spacing.md,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.sm,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>{label}</Text>
                <Text style={{ ...type.body, color: colors.ink }}>{detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Button label="Open in Maps" icon={MapPin} variant="secondary" onPress={() => openInMaps(property)} fullWidth />
    </PropertySection>
  );
}
