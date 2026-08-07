import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "@/components/ui/icons";

import { colors, type } from "@/theme/tokens";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Consistent heading row above every content section. */
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ ...type.heading, color: colors.ink }}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ ...type.label, color: colors.accent }}>{actionLabel}</Text>
          <ChevronRight size={14} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}
