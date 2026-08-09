import React from "react";
import { Text as RNText, type TextProps as RNTextProps, type StyleProp, type TextStyle } from "react-native";
import { colors, type } from "@/theme/tokens";

export interface TextProps extends RNTextProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  bold?: boolean;
  semiBold?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function Text({ children, bold, semiBold, style, ...props }: TextProps) {
  const fontStyle = bold
    ? { fontWeight: "700" as const }
    : semiBold
      ? { fontWeight: "600" as const }
      : {};

  return (
    <RNText
      style={[{ ...type.body, color: colors.ink }, fontStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
}

export default Text;
