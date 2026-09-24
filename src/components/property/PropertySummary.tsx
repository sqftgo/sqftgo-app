import React from "react";
import { Text, View } from "react-native";

import { MapPin, ShieldCheck, Sparkles, type IconComponent } from "@/components/ui/icons";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { formatIndianCurrency, isRentalPurpose } from "./format";

function Badge({
  label,
  icon: Icon,
  color,
  background,
}: {
  label: string;
  icon?: IconComponent;
  color: string;
  background: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: background,
      }}
    >
      {Icon ? <Icon size={12} color={color} strokeWidth={2.2} /> : null}
      <Text style={{ ...type.micro, color }}>{label}</Text>
    </View>
  );
}

export function PropertySummary({ property }: { property: Property }) {
  const rental = isRentalPurpose(property.purpose);

  return (
    <View style={{ gap: spacing.sm, paddingBottom: spacing.xl }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        <Badge
          label={rental ? "For Rent" : "For Sale"}
          color={colors.primary}
          background={colors.primarySoft}
        />
        {property.reraApproved ? (
          <Badge
            label="RERA Approved"
            icon={ShieldCheck}
            color={colors.success}
            background={colors.successSoft}
          />
        ) : null}
        {property.featured ? (
          <Badge
            label="Featured"
            icon={Sparkles}
            color={colors.accent}
            background={colors.accentSoft}
          />
        ) : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.xs }}>
        <Text
          selectable
          style={{ ...type.hero, fontSize: 28, lineHeight: 34, color: colors.ink }}
        >
          {formatIndianCurrency(property.price)}
        </Text>
        {rental ? (
          <Text style={{ ...type.label, color: colors.inkMuted }}>/ month</Text>
        ) : null}
      </View>

      <Text style={{ ...type.title, fontSize: 19, color: colors.ink }}>{property.title}</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <MapPin size={15} color={colors.inkMuted} />
        <Text style={{ ...type.body, color: colors.inkSecondary, flex: 1 }} numberOfLines={1}>
          {property.locality}, {property.city}
        </Text>
      </View>
    </View>
  );
}
