import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  Bank,
  Briefcase,
  Building2,
  Calculator,
  Camera,
  Compass,
  CreditCard,
  DeliveryTruck,
  DesignPencil,
  DocMagnifyingGlass,
  DocStar,
  Droplet,
  FileCheck,
  Flash,
  Flower,
  Hammer,
  HistoricShield,
  HomeSimple,
  Industry,
  Leaf,
  MagicWand,
  Package,
  Packages,
  Palette,
  PiggyBank,
  Rings,
  Ruler,
  Sofa,
  Sparkles,
  Tools,
  Train,
  Truck,
  ViewGrid,
  Wash,
  Wrench,
  type IconComponent,
} from "@/components/ui/icons";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

/** Iconoir keys the API (or admin) may send on `serviceType.icon`. */
const NAMED_ICONS: Record<string, IconComponent> = {
  Compass,
  ShoppingBag: Package,
  Train,
  Sparkles,
  Droplet,
  Settings: Tools,
  DocStar,
  CreditCard,
  Building2,
  Building: Building2,
  EditPencil: DesignPencil,
  DesignPencil,
  Bank,
  Calculator,
  Camera,
  DeliveryTruck,
  DocMagnifyingGlass,
  FileCheck,
  Flash,
  Flower,
  Hammer,
  HistoricShield,
  Home: HomeSimple,
  HomeSimple,
  Industry,
  Leaf,
  MagicWand,
  Package,
  Packages,
  Palette,
  PiggyBank,
  Rings,
  Ruler,
  Sofa,
  Tools,
  Truck,
  ViewGrid,
  Wash,
  Wrench,
  Briefcase,
};

/**
 * Exact service names from the catalog — each gets a unique icon.
 * Keep these 1:1 so the Services grid never looks duplicated.
 */
const CATEGORY_ICONS: Record<string, IconComponent> = {
  "interior decorator": Palette,
  "architect": Ruler,
  "building contractor": Hammer,
  "vastu consultant": Compass,
  "home valuation/inspection": Calculator,
  "home shifting/deep cleaning": Wash,
  "architect & interior designer": DesignPencil,
  "house services": HomeSimple,
  "movers & packers": DeliveryTruck,
  "contractors": Tools,
  "event managers": MagicWand,
  "wedding planners": Rings,
  // Common aliases / older labels
  "interior design": Sofa,
  "interiors": Sofa,
  "home valuation": DocMagnifyingGlass,
  "home inspection": DocStar,
  "home shifting": Truck,
  "deep cleaning": Sparkles,
  "movers and packers": Packages,
  "event manager": Sparkles,
  "wedding planner": Flower,
  "property valuation": Calculator,
  "home loans": PiggyBank,
  "home loan": Bank,
  "legal advice": HistoricShield,
  "legal services": FileCheck,
  "photography": Camera,
  "landscaping": Leaf,
  "gardening": Flower,
  "electrical": Flash,
  "plumbing": Droplet,
  "security": HistoricShield,
  "carpentry": Industry,
  "painting": Palette,
  "civil work": Building2,
  "vastu": Compass,
};

/** Emoji values currently stored on service_types.icon in the API. */
const EMOJI_ICONS: Record<string, IconComponent> = {
  "🎨": Palette,
  "📐": Ruler,
  "🔨": Hammer,
  "🧭": Compass,
  "🧮": Calculator,
  "🚚": Wash, // Home Shifting/Deep Cleaning in catalog
  "🏛️": DesignPencil,
  "🏠": HomeSimple,
  "📦": DeliveryTruck,
  "🧱": Tools,
  "🎉": MagicWand,
  "💍": Rings,
};

const KEYWORD_ICONS: [RegExp, IconComponent][] = [
  [/interior\s*decorator/i, Palette],
  [/architect\s*&\s*interior|interior\s*designer/i, DesignPencil],
  [/architect/i, Ruler],
  [/building\s*contractor/i, Hammer],
  [/contractor/i, Tools],
  [/vaa?stu/i, Compass],
  [/valuat|apprais|inspect|survey|calculator/i, Calculator],
  [/shift.*clean|clean.*shift/i, Wash],
  [/deep\s*clean|housekeep|maid/i, Sparkles],
  [/mover|pack|relocat|logistic/i, DeliveryTruck],
  [/house\s*service|handyman|repair|maintenance/i, HomeSimple],
  [/wedding|marriage|bridal|ring/i, Rings],
  [/event|party|celebration/i, MagicWand],
  [/plumb|pipe|water|sanitar/i, Droplet],
  [/electric|wiring|inverter|solar/i, Flash],
  [/loan|finance|mortgage|emi/i, PiggyBank],
  [/legal|lawyer|advocate|title|registry/i, HistoricShield],
  [/photo|video|cinema/i, Camera],
  [/garden|landscape|lawn|horticult/i, Leaf],
  [/carpenter|wood|modular/i, Industry],
  [/paint|decor|furnish/i, Sofa],
];

function normalizeIconKey(raw: string): string {
  return raw
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function iconFromApiKey(raw: string): IconComponent | undefined {
  if (NAMED_ICONS[raw]) return NAMED_ICONS[raw];
  const kebab = normalizeIconKey(raw);
  const pascal = kebab
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return NAMED_ICONS[pascal] ?? NAMED_ICONS[raw.replace(/[-_\s]/g, "")];
}

/**
 * Resolves a distinct icon per service.
 * Prefer the service **name** (API `icon` is often an emoji).
 */
export function serviceIconFor(nameOrIcon?: string, iconHint?: string): IconComponent {
  const name = nameOrIcon?.trim();
  const hint = iconHint?.trim();

  if (name) {
    const exact = CATEGORY_ICONS[name.toLowerCase()];
    if (exact) return exact;
  }

  if (hint && EMOJI_ICONS[hint]) return EMOJI_ICONS[hint];
  if (name && EMOJI_ICONS[name]) return EMOJI_ICONS[name];

  if (hint) {
    const fromHint = iconFromApiKey(hint);
    if (fromHint) return fromHint;
  }
  if (name) {
    const fromName = iconFromApiKey(name);
    if (fromName) return fromName;
  }

  const haystack = [name, hint].filter(Boolean).join(" ");
  if (haystack) {
    const hit = KEYWORD_ICONS.find(([re]) => re.test(haystack))?.[1];
    if (hit) return hit;
  }

  return Briefcase;
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
