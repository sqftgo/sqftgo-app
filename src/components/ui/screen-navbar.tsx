import React from "react";
import { Pressable, Text, View } from "react-native";

import { colors, radius, spacing, type } from "@/theme/tokens";

export interface ScreenNavbarProps {
  /** Small label above the title (Explore uses “Searching in”). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional right-side control (Add, Edit, icon button, etc.). */
  rightAction?: React.ReactNode;
  /** When set, title row becomes a pressable (e.g. city picker). */
  onPressTitle?: () => void;
}

/**
 * Shared tab-screen header — same visual language as Explore.
 * Place inside ScrollView / FlatList `ListHeaderComponent` so it scrolls away.
 */
export function ScreenNavbar({
  eyebrow,
  title,
  subtitle,
  rightAction,
  onPressTitle,
}: ScreenNavbarProps) {
  const titleBlock = (
    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
      {eyebrow ? (
        <Text style={{ ...type.micro, color: colors.inkMuted }}>{eyebrow}</Text>
      ) : null}
      <Text style={{ ...type.heading, color: colors.ink }} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
      }}
    >
      {onPressTitle ? (
        <Pressable
          onPress={onPressTitle}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1,
            borderRadius: radius.md,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          {titleBlock}
        </Pressable>
      ) : (
        titleBlock
      )}
      {rightAction ? <View style={{ flexShrink: 0, paddingTop: eyebrow ? 14 : 0 }}>{rightAction}</View> : null}
    </View>
  );
}
