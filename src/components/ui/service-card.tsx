import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  Building2,
  Compass,
  CreditCard,
  ChevronRight,
  DocStar,
  Droplet,
  EditPencil,
  Settings,
  ShoppingBag,
  Sparkles,
  Train,
} from "@/components/ui/icons";
import type { ServiceCategory } from "@/data/services";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const SERVICE_ICONS: Record<string, any> = {
  Compass,
  ShoppingBag,
  Train,
  Sparkles,
  Droplet,
  Settings,
  DocStar,
  CreditCard,
  Building2,
  EditPencil,
};

interface ServiceCardProps {
  service: ServiceCategory;
  onPress: () => void;
}

/** Compact category tile for the Services grid. Icon + name + subtitle. */
export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const IconComponent = SERVICE_ICONS[service.iconName] || Compass;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${service.title}`}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md + 2,
        gap: spacing.sm,
        boxShadow: shadow.card,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconComponent size={20} color={colors.accent} strokeWidth={2.2} />
      </View>

      <View style={{ gap: 2 }}>
        <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 14 }} numberOfLines={1}>
          {service.title}
        </Text>
        <Text style={{ ...type.caption, color: colors.inkMuted, lineHeight: 16 }} numberOfLines={2}>
          {service.subtitle}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 }}>
        <Text style={{ ...type.micro, color: colors.accent, fontWeight: "700" }}>
          Explore
        </Text>
        <ChevronRight size={12} color={colors.accent} />
      </View>
    </Pressable>
  );
}
