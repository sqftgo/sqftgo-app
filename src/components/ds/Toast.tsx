import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckCircle, InfoCircle } from "@/components/ui/icons";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

type ToastKind = "success" | "error" | "info";
type ToastOptions = { message: string; kind?: ToastKind };

let show: ((o: ToastOptions) => void) | null = null;

/** Non-blocking confirmation, e.g. "Saved". Use appAlert for decisions. */
export function toast(message: string, kind: ToastKind = "success") {
  show?.({ message, kind });
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const present = useCallback((o: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        o.kind === "error"
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    setCurrent({ ...o, id: Date.now() });
    timer.current = setTimeout(() => setCurrent(null), 2600);
  }, []);

  useEffect(() => {
    show = present;
    return () => {
      show = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [present]);

  const Icon = current?.kind === "success" ? CheckCircle : InfoCircle;
  const tint =
    current?.kind === "error" ? colors.danger : current?.kind === "info" ? colors.info : colors.success;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {current ? (
        <Animated.View
          key={current.id}
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(180)}
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + spacing.sm }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <Icon size={20} color={tint} />
          <Text style={styles.text} numberOfLines={2}>
            {current.message}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.raised,
  },
  text: { ...type.label, color: colors.ink, flex: 1 },
});
