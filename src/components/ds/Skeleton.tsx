import React, { useEffect } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, spacing } from "@/theme/tokens";

export function Skeleton({
  width = "100%",
  height = 16,
  rounded = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    if (reduced) return;
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceSubtle }, animated, style]}
    />
  );
}

/** Placeholder matching a full-width property card. */
export function PropertyCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading">
      <Skeleton height={200} rounded={radius.lg} />
      <View style={styles.body}>
        <Skeleton width="45%" height={20} />
        <Skeleton width="80%" />
        <Skeleton width="60%" height={14} />
      </View>
    </View>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ gap: spacing.md }} accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={44} height={44} rounded={radius.sm} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Skeleton width="70%" />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, marginBottom: spacing.xl },
  body: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
});
