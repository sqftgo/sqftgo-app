import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

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
        paddingVertical: spacing.md + 1,
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
          width: 34,
          height: 34,
          borderRadius: radius.sm + 2,
          borderCurve: "continuous",
          backgroundColor: destructive ? colors.dangerSoft : colors.surfaceSubtle,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ ...type.body, lineHeight: undefined, color: destructive ? colors.danger : colors.ink }}>
          {label}
        </Text>
        {sub && <Text style={{ ...type.caption, color: colors.inkMuted }}>{sub}</Text>}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {value && <Text style={{ ...type.caption, color: colors.inkMuted }}>{value}</Text>}
        {rightElement}
        {showChevron && <ChevronRight size={15} color={colors.inkMuted} />}
      </View>
    </Pressable>
  );
}

/** Card wrapper that groups MenuRows. */
export function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
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
