import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MessageSquare } from "@/components/ui/icons";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

interface StickyCtaProps {
  price: string;
  period?: string;
  primaryLabel: string;
  onPrimary: () => void;
  /** Optional icon-only secondary action (Inquire). */
  onSecondary?: () => void;
  secondaryLabel?: string;
}

export function StickyCta({
  price,
  period,
  primaryLabel,
  onPrimary,
  onSecondary,
  secondaryLabel,
}: StickyCtaProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Math.max(insets.bottom, spacing.md),
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        boxShadow: shadow.raised,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ ...type.heading, fontSize: 18, color: colors.ink, fontVariant: ["tabular-nums"] }}
          numberOfLines={1}
        >
          {price}
        </Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>{period ?? "Total price"}</Text>
      </View>

      {onSecondary ? (
        <Pressable
          onPress={onSecondary}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel ?? "Inquire"}
          style={({ pressed }) => ({
            height: 50,
            paddingHorizontal: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.primaryBorder,
            backgroundColor: pressed ? colors.primarySoft : colors.surface,
          })}
        >
          <MessageSquare size={18} color={colors.ink} />
          <Text style={{ ...type.emphasis, color: colors.ink }}>{secondaryLabel ?? "Inquire"}</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onPrimary}
        accessibilityRole="button"
        style={({ pressed }) => ({
          height: 50,
          paddingHorizontal: spacing.xl,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.md,
          backgroundColor: colors.accent,
          boxShadow: shadow.button,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ ...type.emphasis, fontSize: 15, color: colors.onAccent }}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}
