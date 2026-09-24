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
  FileCheck,
  Settings,
  ShoppingBag,
  Sparkles,
  Train,
  ViewGrid,
  type IconComponent,
} from "@/components/ui/icons";
import type { ServiceCategory } from "@/data/services";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const SERVICE_ICONS: Record<string, IconComponent> = {
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

const KEYWORD_ICONS: [RegExp, IconComponent][] = [
  [/interior|decor/i, EditPencil],
  [/architect/i, Building2],
  [/contract|builder|construction/i, Settings],
  [/vaa?stu/i, Compass],
  [/valuation|inspection/i, DocStar],
  [/shift|mover|pack|clean/i, ShoppingBag],
  [/plumb|electric|house|repair/i, Droplet],
  [/loan|finance|bank/i, CreditCard],
  [/legal|lawyer|document/i, FileCheck],
  [/event|wedding/i, Sparkles],
];

/** Resolves an icon from a known icon name, falling back to keywords in the service name. */
export function serviceIconFor(nameOrIcon?: string): IconComponent {
  if (!nameOrIcon) return Compass;
  if (SERVICE_ICONS[nameOrIcon]) return SERVICE_ICONS[nameOrIcon];
  return KEYWORD_ICONS.find(([re]) => re.test(nameOrIcon))?.[1] ?? Compass;
}

export const ALL_SERVICES_ICON = ViewGrid;

interface ServiceTileProps {
  label: string;
  icon: IconComponent;
  onPress: () => void;
  selected?: boolean;
}

/** Icon-over-label tile for 4-column category grids. */
export function ServiceTile({ label, icon: Icon, onPress, selected }: ServiceTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({
        width: "25%",
        alignItems: "center",
        gap: spacing.xs + 2,
        paddingHorizontal: 2,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: selected ? colors.accent : colors.surface,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.border,
          boxShadow: shadow.card,
        }}
      >
        <Icon size={24} color={selected ? colors.onAccent : colors.accent} strokeWidth={1.8} />
      </View>
      <Text
        style={{
          ...type.caption,
          fontSize: 11.5,
          lineHeight: 15,
          textAlign: "center",
          color: selected ? colors.accent : colors.ink,
          fontWeight: selected ? "600" : "500",
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface ServiceCardProps {
  service: ServiceCategory;
  onPress: () => void;
  variant?: "card" | "tile";
}

/** Category entry for the Services screen: a grid `tile` or a full-width `card`. */
export function ServiceCard({ service, onPress, variant = "card" }: ServiceCardProps) {
  const IconComponent = serviceIconFor(service.iconName);

  if (variant === "tile") {
    return <ServiceTile label={service.title} icon={IconComponent} onPress={onPress} />;
  }

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
