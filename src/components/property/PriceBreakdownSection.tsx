import React, { useMemo } from "react";
import { Text, View } from "react-native";

import type { PriceBreakdown } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { formatIndianCurrency, isRentalPurpose } from "./format";
import { PropertySection } from "./PropertySection";

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={{ ...type.body, color: colors.inkSecondary, flex: 1 }}>{label}</Text>
      <Text
        selectable
        style={{
          ...(emphasize ? type.emphasis : type.body),
          color: colors.ink,
          fontWeight: emphasize ? "700" : "500",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function hasExtraCosts(b: PriceBreakdown): boolean {
  return Boolean(
    (b.securityDeposit != null && b.securityDeposit > 0) ||
      b.maintenance > 0 ||
      (b.registrationFees != null && b.registrationFees > 0) ||
      (b.gst != null && b.gst > 0),
  );
}

/** Mirrors website guide-price / cost lines when the API provides a breakdown. */
export function PriceBreakdownSection({
  breakdown,
  purpose,
  listedPrice,
}: {
  breakdown?: PriceBreakdown | null;
  purpose: string;
  listedPrice: number;
}) {
  const rental = isRentalPurpose(purpose);

  const rows = useMemo(() => {
    if (!breakdown || !hasExtraCosts(breakdown)) return [];
    const items: { label: string; value: string; emphasize?: boolean }[] = [];

    const base = breakdown.basePrice > 0 ? breakdown.basePrice : listedPrice;
    items.push({
      label: rental ? "Monthly rent" : "Guide price",
      value: formatIndianCurrency(base),
      emphasize: true,
    });

    if (breakdown.securityDeposit != null && breakdown.securityDeposit > 0) {
      items.push({
        label: "Security deposit",
        value: formatIndianCurrency(breakdown.securityDeposit),
      });
    }
    if (breakdown.maintenance > 0) {
      items.push({
        label: rental ? "Maintenance / month" : "Maintenance",
        value: formatIndianCurrency(breakdown.maintenance),
      });
    }
    if (breakdown.registrationFees != null && breakdown.registrationFees > 0) {
      items.push({
        label: "Registration fees",
        value: formatIndianCurrency(breakdown.registrationFees),
      });
    }
    if (breakdown.gst != null && breakdown.gst > 0) {
      items.push({
        label: "GST",
        value: formatIndianCurrency(breakdown.gst),
      });
    }

    return items;
  }, [breakdown, listedPrice, rental]);

  if (rows.length === 0) return null;

  return (
    <PropertySection title="Price details">
      <View
        style={{
          borderRadius: radius.lg,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceSubtle,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        }}
      >
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <Row {...row} />
          </View>
        ))}
      </View>
      <Text style={{ ...type.caption, color: colors.inkMuted }}>
        Figures shared by the lister. Confirm exact costs before you commit.
      </Text>
    </PropertySection>
  );
}
