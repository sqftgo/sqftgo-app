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
    <View style={{ flex: 1, gap: 1, minWidth: 0, justifyContent: "center" }}>
      {eyebrow ? (
        <Text
          style={{
            ...type.micro,
            color: colors.inkMuted,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            fontSize: 11,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          ...type.title,
          color: colors.ink,
          fontSize: 22,
          fontWeight: "700",
          letterSpacing: -0.4,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            ...type.caption,
            color: colors.inkMuted,
            fontSize: 12,
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
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
      {rightAction ? (
        <View style={{ flexShrink: 0, flexDirection: "row", alignItems: "center" }}>
          {rightAction}
        </View>
      ) : null}
    </View>
  );
}
