import React, { useState } from "react";
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronDown, ChevronUp } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

export interface AccordionItem {
  key: string;
  title: string;
  body: React.ReactNode;
}

/** Grouped expandable rows; one open at a time. */
export function Accordion({ items, title }: { items: AccordionItem[]; title?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === key ? null : key));
  };

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.card}>
        {items.map((item, i) => {
          const expanded = open === item.key;
          return (
            <View key={item.key}>
              {i > 0 ? <View style={styles.separator} /> : null}
              <Pressable
                onPress={() => toggle(item.key)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSubtle }]}
              >
                <Text style={styles.title}>{item.title}</Text>
                {expanded ? (
                  <ChevronUp size={18} color={colors.inkMuted} />
                ) : (
                  <ChevronDown size={18} color={colors.inkMuted} />
                )}
              </Pressable>
              {expanded ? (
                <View style={styles.body}>
                  {typeof item.body === "string" ? <Text style={styles.bodyText}>{item.body}</Text> : item.body}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: {
    ...type.caption,
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { ...type.emphasis, color: colors.ink, flex: 1 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  bodyText: { ...type.body, color: colors.inkSecondary },
});
