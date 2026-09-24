import React from "react";
import { Text, View } from "react-native";

import type { IconComponent } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

export interface KeyFact {
  icon: IconComponent;
  value: string;
  label: string;
}

export function KeyFacts({ facts }: { facts: KeyFact[] }) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surfaceSubtle,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        paddingVertical: spacing.md,
        marginBottom: spacing.xl,
      }}
    >
      {facts.map(({ icon: Icon, value, label }, i) => (
        <View
          key={label}
          style={{
            flex: 1,
            alignItems: "center",
            gap: 4,
            paddingHorizontal: spacing.xs,
            borderLeftWidth: i === 0 ? 0 : 1,
            borderLeftColor: colors.border,
          }}
        >
          <Icon size={20} color={colors.accent} strokeWidth={1.8} />
          <Text
            style={{ ...type.emphasis, color: colors.ink, textAlign: "center" }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
