import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "@/components/ui/icons";
import type { LucideIcon } from "@/components/ui/icons";

import { colors, radius, spacing, type } from "@/theme/tokens";

interface MenuRowProps {
  label: string;
  sub?: string;
  value?: string;
  icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  /** Set false on the last row of a group */
  showDivider?: boolean;
}

/** Settings-style list row used in Profile and other menu groups. */
export function MenuRow({
  label,
  sub,
  value,
  icon: Icon,
  onPress,
  destructive = false,
  showChevron = true,
  rightElement,
  showDivider = true,
}: MenuRowProps) {
  const tint = destructive ? colors.danger : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: colors.border,
        backgroundColor: pressed
          ? destructive
            ? colors.dangerSoft
            : colors.surfaceSubtle
          : "transparent",
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          borderCurve: "continuous",
          backgroundColor: destructive ? colors.dangerSoft : colors.surfaceSubtle,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={17} color={tint} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            ...type.emphasis,
            color: destructive ? colors.danger : colors.ink,
          }}
        >
          {label}
        </Text>
        {sub && (
          <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {value && (
          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ ...type.micro, color: colors.inkSecondary }}>{value}</Text>
          </View>
        )}
        {rightElement}
        {showChevron && <ChevronRight size={16} color={colors.inkMuted} />}
      </View>
    </Pressable>
  );
}

/** Group container that groups MenuRows with subtle border. */
export function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

