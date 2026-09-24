import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Info } from "@/components/ui/icons";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { formatIndianCurrency, isRentalPurpose } from "./format";
import { PropertySection } from "./PropertySection";

function calculateEmi(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ ...type.body, color: colors.inkSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ ...type.emphasis, color: colors.ink, fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
    </View>
  );
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const button = (symbol: string, onPress: () => void, a11y: string) => (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: pressed ? colors.accent : colors.borderStrong,
      })}
    >
      <Text style={{ ...type.heading, lineHeight: 20, color: colors.ink }}>{symbol}</Text>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      <Text style={{ ...type.label, color: colors.inkSecondary, flex: 1 }}>{label}</Text>
      {button("−", onDecrement, `Decrease ${label}`)}
      <Text
        style={{
          ...type.emphasis,
          color: colors.ink,
          minWidth: 64,
          textAlign: "center",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      {button("+", onIncrement, `Increase ${label}`)}
    </View>
  );
}

export function CostEmiSection({ property }: { property: Property }) {
  const rental = isRentalPurpose(property.purpose);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(15);
  const [interestRate, setInterestRate] = useState(8.5);

  const loanAmount = property.price * (1 - downPaymentPercent / 100);
  const emi = calculateEmi(loanAmount, interestRate, loanTermYears);

  const rows = [
    { label: rental ? "Monthly rent" : "Base price", value: formatIndianCurrency(property.price) },
    ...(property.priceBreakdown?.securityDeposit
      ? [
          {
            label: "Security deposit (refundable)",
            value: formatIndianCurrency(property.priceBreakdown.securityDeposit),
          },
        ]
      : []),
    {
      label: "Monthly maintenance",
      value: `₹${(property.priceBreakdown?.maintenance || 2500).toLocaleString("en-IN")}/mo`,
    },
    ...(rental
      ? []
      : [
          {
            label: "Stamp duty & registration (est.)",
            value: formatIndianCurrency(
              property.priceBreakdown?.registrationFees || property.price * 0.06,
            ),
          },
        ]),
  ];

  return (
    <PropertySection title={rental ? "Cost breakdown" : "Cost & EMI"}>
      <View>
        {rows.map((row, i) => (
          <Row key={row.label} label={row.label} value={row.value} last={i === rows.length - 1} />
        ))}
      </View>

      {rental ? null : (
        <View
          style={{
            marginTop: spacing.xs,
            padding: spacing.lg,
            gap: spacing.md,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            backgroundColor: colors.surfaceSubtle,
          }}
        >
          <View style={{ gap: 2 }}>
            <Text style={{ ...type.caption, color: colors.inkMuted }}>Estimated monthly EMI</Text>
            <Text
              selectable
              style={{ ...type.hero, color: colors.accent, fontVariant: ["tabular-nums"] }}
            >
              {formatIndianCurrency(emi)}
              <Text style={{ ...type.label, color: colors.inkMuted }}> / month</Text>
            </Text>
          </View>

          <Stepper
            label={`Down payment (${downPaymentPercent}%)`}
            value={formatIndianCurrency(property.price * (downPaymentPercent / 100))}
            onDecrement={() => setDownPaymentPercent((v) => Math.max(10, v - 5))}
            onIncrement={() => setDownPaymentPercent((v) => Math.min(80, v + 5))}
          />
          <Stepper
            label="Interest rate"
            value={`${interestRate}%`}
            onDecrement={() => setInterestRate((v) => parseFloat(Math.max(6.5, v - 0.25).toFixed(2)))}
            onIncrement={() => setInterestRate((v) => parseFloat(Math.min(15, v + 0.25).toFixed(2)))}
          />
          <Stepper
            label="Tenure"
            value={`${loanTermYears} yrs`}
            onDecrement={() => setLoanTermYears((v) => Math.max(5, v - 5))}
            onIncrement={() => setLoanTermYears((v) => Math.min(30, v + 5))}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Info size={13} color={colors.inkMuted} />
            <Text style={{ ...type.caption, color: colors.inkMuted, flex: 1 }}>
              Based on a loan amount of {formatIndianCurrency(loanAmount)}
            </Text>
          </View>
        </View>
      )}
    </PropertySection>
  );
}
