import React from "react";
import { Text, View } from "react-native";
import type { LucideIcon } from "@/components/ui/icons";

import { Button } from "@/components/ds/Button";
import { colors, radius, spacing, type } from "@/theme/tokens";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Tighter padding for embedding inside a section (e.g. home rails). */
  compact?: boolean;
}

/** Teaches the user what belongs here and how to fill it. */
export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, compact }: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: compact ? spacing.xl : spacing.xxl * 2,
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.md,
          borderCurve: "continuous",
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
      {actionLabel && onAction ? (
        <Button label={actionLabel} size="md" onPress={onAction} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}
