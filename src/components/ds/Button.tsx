import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { IconComponent } from "@/components/ui/icons";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const HEIGHT: Record<ButtonSize, number> = { sm: 34, md: touchTarget, lg: 52 };

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconComponent;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  /** Light impact haptic on press (default true for primary). */
  haptic?: boolean;
}

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; bgPressed: string; fg: string; border: string }
> = {
  primary: { bg: colors.accent, bgPressed: colors.accentPressed, fg: colors.onAccent, border: colors.accent },
  secondary: { bg: colors.surface, bgPressed: colors.surfaceSubtle, fg: colors.ink, border: colors.borderStrong },
  tertiary: { bg: "transparent", bgPressed: colors.accentSoft, fg: colors.accent, border: "transparent" },
  destructive: { bg: colors.dangerSoft, bgPressed: "rgba(194, 65, 45, 0.16)", fg: colors.danger, border: "transparent" },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
  haptic,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;
  const height = HEIGHT[size];

  const handlePress = () => {
    if (inactive) return;
    if ((haptic ?? variant === "primary") && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      hitSlop={size === "sm" ? (touchTarget - HEIGHT.sm) / 2 : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: pressed ? v.bgPressed : v.bg,
          borderColor: v.border,
          opacity: disabled ? 0.45 : 1,
          paddingHorizontal: variant === "tertiary" || size === "sm" ? spacing.md : spacing.xl,
          borderRadius: size === "sm" ? radius.sm : radius.md,
        },
        fullWidth && styles.full,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === "sm" ? 15 : 18} color={v.fg} strokeWidth={2} /> : null}
          <Text
            style={[size === "lg" ? type.emphasis : size === "sm" ? type.caption : type.label, styles.label, { color: v.fg }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  full: { alignSelf: "stretch" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
