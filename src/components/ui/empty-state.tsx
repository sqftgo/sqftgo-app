import React from "react";
import { Pressable, Text, View } from "react-native";
import type { LucideIcon } from "@/components/ui/icons";

import { colors, radius, spacing, type } from "@/theme/tokens";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Teaches the user what belongs here and how to fill it. */
export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: spacing.xxl * 2,
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={28} color={colors.accent} />
      </View>
      <Text style={{ ...type.heading, color: colors.ink, textAlign: "center" }}>{title}</Text>
      <Text
        style={{
          ...type.body,
          color: colors.inkMuted,
          textAlign: "center",
          maxWidth: 280,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: spacing.sm,
            backgroundColor: colors.accent,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: radius.md,
            borderCurve: "continuous",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ ...type.label, color: colors.onAccent }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
