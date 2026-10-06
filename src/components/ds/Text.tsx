import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { formatIndianPrice } from "@/lib/format";
import { colors, type } from "@/theme/tokens";

export type TextVariant = keyof typeof type;
export type TextTone = "default" | "secondary" | "muted" | "accent" | "primary" | "success" | "warning" | "danger" | "inverse";

const TONE: Record<TextTone, string> = {
  default: colors.ink,
  secondary: colors.inkSecondary,
  muted: colors.inkMuted,
  accent: colors.accent,
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  inverse: colors.onPrimary,
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: "left" | "center" | "right";
}

/** Token-backed text. Scales with the system font size; long-form copy should stay `body`. */
export function Text({ variant = "body", tone = "default", align, style, ...rest }: TextProps) {
  return <RNText {...rest} style={[type[variant], { color: TONE[tone] }, align && { textAlign: align }, style]} />;
}

export interface PriceTextProps extends Omit<TextProps, "children"> {
  amount: number;
  /** Adds "/mo" for rentals and leases. */
  purpose?: string;
  /** "Crore" / "Lakh" instead of "Cr" / "L". */
  long?: boolean;
}

/** Rupee amount in Lakh / Crore, with tabular figures so prices line up in lists. */
export function PriceText({ amount, purpose, long, variant = "emphasis", tone = "default", style, ...rest }: PriceTextProps) {
  const rental = purpose === "rent" || purpose === "lease";
  return (
    <Text variant={variant} tone={tone} style={[{ fontVariant: ["tabular-nums"] }, style]} {...rest}>
      {formatIndianPrice(amount, { long })}
      {rental ? "/mo" : ""}
    </Text>
  );
}
