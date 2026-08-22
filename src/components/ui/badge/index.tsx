import React from "react";
import {
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Text, type TextProps } from "@/components/ui/text";
import { colors, radius, spacing, type } from "@/theme/tokens";

export interface BadgeProps extends ViewProps {
  variant?: "solid" | "outline" | "subtle";
  action?: "info" | "success" | "warning" | "error" | "muted" | "accent" | "primary";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export interface BadgeTextProps extends TextProps {
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  className?: string;
}

export function BadgeText({ children, style, ...props }: BadgeTextProps) {
  return (
    <Text style={[{ ...type.micro, fontWeight: "700" }, style]} {...props}>
      {children}
    </Text>
  );
}

export function BadgeIcon({
  as: IconComponent,
  size = 12,
  color,
  style,
  ...props
}: {
  as?: React.ComponentType<any>;
  size?: number;
  color?: string;
  style?: any;
  [key: string]: any;
}) {
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} style={style} {...props} />;
}

export function Badge({
  variant = "subtle",
  action = "info",
  size = "md",
  children,
  style,
  ...props
}: BadgeProps) {
  let bg: string = colors.surfaceSubtle;
  let borderColor: string = colors.border;

  if (variant === "solid") {
    if (action === "success") bg = colors.success;
    else if (action === "accent") bg = colors.accent;
    else if (action === "warning") bg = "#B45309";
    else if (action === "error") bg = colors.danger;
    else if (action === "info") bg = colors.info;
    else bg = colors.primary;
    borderColor = bg;
  } else if (variant === "subtle") {
    if (action === "success") bg = colors.successSoft;
    else if (action === "accent") bg = colors.accentSoft;
    else if (action === "warning") bg = "rgba(255, 184, 0, 0.12)";
    else if (action === "error") bg = colors.dangerSoft;
    else if (action === "info") bg = colors.infoSoft;
    else bg = colors.primarySoft;
  }

  const padH = size === "sm" ? spacing.xs + 2 : size === "lg" ? spacing.md : spacing.sm + 2;
  const padV = size === "sm" ? 2 : size === "lg" ? 6 : 4;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: padH,
          paddingVertical: padV,
          borderRadius: radius.md,
          backgroundColor: bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default Badge;
