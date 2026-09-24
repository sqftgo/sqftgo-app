import React from "react";
import { Pressable, Text, View } from "react-native";

import { colors, spacing, type } from "@/theme/tokens";

interface PropertySectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

/** Flat content block separated from the previous one by a hairline. */
export function PropertySection({ title, actionLabel, onAction, children }: PropertySectionProps) {
  return (
    <View
      style={{
        paddingVertical: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ ...type.heading, fontSize: 17, color: colors.ink }}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={{ ...type.label, fontWeight: "600", color: colors.accent }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
