import React from "react";
import { Text, View } from "react-native";

import { colors, spacing, type } from "@/theme/tokens";

export interface OverviewItem {
  label: string;
  value: string;
}

/** Two-column label / value list. */
export function OverviewList({ items }: { items: OverviewItem[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg }}>
      {items.map((item) => (
        <View key={item.label} style={{ width: "50%", paddingRight: spacing.md, gap: 2 }}>
          <Text style={{ ...type.caption, color: colors.inkMuted }}>{item.label}</Text>
          <Text style={{ ...type.emphasis, color: colors.ink }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}
