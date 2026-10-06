import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import type { IconComponent } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

export interface SwipeAction {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  tone?: "danger" | "neutral" | "accent";
}

const TONE = {
  danger: { bg: colors.danger, fg: colors.onAccent },
  neutral: { bg: colors.inkMuted, fg: colors.onAccent },
  accent: { bg: colors.accent, fg: colors.onAccent },
} as const;

const ACTION_WIDTH = 84;

/**
 * Swipe left to reveal actions. The same actions are exposed to screen readers as
 * accessibility actions, so swiping is never the only way to reach them.
 */
export function SwipeRow({ actions, children }: { actions: SwipeAction[]; children: React.ReactNode }) {
  const ref = useRef<SwipeableMethods>(null);

  if (actions.length === 0) return <>{children}</>;

  const run = (a: SwipeAction) => {
    ref.current?.close();
    a.onPress();
  };

  return (
    <View
      accessible={false}
      accessibilityActions={actions.map((a) => ({ name: a.label, label: a.label }))}
      onAccessibilityAction={(e) => {
        const a = actions.find((x) => x.label === e.nativeEvent.actionName);
        if (a) a.onPress();
      }}
    >
      <Swipeable
        ref={ref}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
        }}
        containerStyle={styles.container}
        renderRightActions={() => (
          <View style={[styles.actions, { width: ACTION_WIDTH * actions.length }]}>
            {actions.map((a) => {
              const t = TONE[a.tone ?? "neutral"];
              const Icon = a.icon;
              return (
                <Pressable
                  key={a.label}
                  onPress={() => run(a)}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                  style={({ pressed }) => [styles.action, { backgroundColor: t.bg }, pressed && { opacity: 0.85 }]}
                >
                  {Icon ? <Icon size={20} color={t.fg} /> : null}
                  <Text style={[styles.label, { color: t.fg }]} numberOfLines={1}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      >
        {children}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.lg, borderCurve: "continuous" },
  actions: { flexDirection: "row", marginLeft: spacing.sm, borderRadius: radius.lg, overflow: "hidden" },
  action: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  label: { ...type.caption, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
