import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, type } from "@/theme/tokens";

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 4;
const HIT_SLOP = 12;

interface FilterRangeSliderProps {
  /** Ordered ascending stops (first = open min, last = open max). */
  stops: number[];
  /** Empty string = no min filter (leftmost stop). */
  minValue: string;
  /** Empty string = no max filter (rightmost stop). */
  maxValue: string;
  onChange: (minValue: string, maxValue: string) => void;
  formatValue: (amount: number, edge: "min" | "max") => string;
  /** Labels under the track ends. Defaults to formatValue. */
  formatEndLabel?: (amount: number, edge: "min" | "max") => string;
  accessibilityLabel?: string;
}

function indexForValue(stops: number[], value: string, edge: "min" | "max"): number {
  if (!value) return edge === "min" ? 0 : stops.length - 1;
  const n = Number(value);
  if (!Number.isFinite(n)) return edge === "min" ? 0 : stops.length - 1;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < stops.length; i++) {
    const d = Math.abs(stops[i] - n);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function emitValue(stops: number[], index: number, edge: "min" | "max"): string {
  if (edge === "min" && index <= 0) return "";
  if (edge === "max" && index >= stops.length - 1) return "";
  return String(stops[index]);
}

/**
 * Amazon-style dual-handle range bar. Thumbs snap to each stop across the full scale.
 */
export function FilterRangeSlider({
  stops,
  minValue,
  maxValue,
  onChange,
  formatValue,
  formatEndLabel,
  accessibilityLabel,
}: FilterRangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageX = useRef(0);
  const stopsRef = useRef(stops);
  const minIdxRef = useRef(0);
  const maxIdxRef = useRef(stops.length - 1);
  const activeThumb = useRef<"min" | "max" | null>(null);
  const lastHapticIdx = useRef<number | null>(null);

  const minIdx = indexForValue(stops, minValue, "min");
  const maxIdx = Math.max(minIdx, indexForValue(stops, maxValue, "max"));
  minIdxRef.current = minIdx;
  maxIdxRef.current = maxIdx;
  stopsRef.current = stops;

  const usableWidth = Math.max(0, trackWidth - THUMB_SIZE);
  const endFormat = formatEndLabel ?? formatValue;

  const xForIndex = useCallback(
    (index: number) => {
      if (stops.length <= 1 || usableWidth <= 0) return 0;
      return (index / (stops.length - 1)) * usableWidth;
    },
    [stops.length, usableWidth],
  );

  const indexForPageX = useCallback(
    (pageX: number) => {
      if (stops.length <= 1 || usableWidth <= 0) return 0;
      const localX = pageX - trackPageX.current - THUMB_SIZE / 2;
      const ratio = Math.max(0, Math.min(1, localX / usableWidth));
      return Math.round(ratio * (stops.length - 1));
    },
    [stops.length, usableWidth],
  );

  const commit = useCallback(
    (nextMin: number, nextMax: number) => {
      const s = stopsRef.current;
      onChange(emitValue(s, nextMin, "min"), emitValue(s, nextMax, "max"));
    },
    [onChange],
  );

  const hapticAt = (idx: number) => {
    if (lastHapticIdx.current === idx) return;
    lastHapticIdx.current = idx;
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
  };

  const measureTrack = (cb?: () => void) => {
    trackRef.current?.measureInWindow((x) => {
      trackPageX.current = x;
      cb?.();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          measureTrack(() => {
            const idx = indexForPageX(evt.nativeEvent.pageX);
            const mid = (minIdxRef.current + maxIdxRef.current) / 2;
            const distMin = Math.abs(idx - minIdxRef.current);
            const distMax = Math.abs(idx - maxIdxRef.current);
            if (distMin < distMax) activeThumb.current = "min";
            else if (distMax < distMin) activeThumb.current = "max";
            else activeThumb.current = idx <= mid ? "min" : "max";
            lastHapticIdx.current = null;
          });
        },
        onPanResponderMove: (evt) => {
          const thumb = activeThumb.current;
          if (!thumb) return;
          let idx = indexForPageX(evt.nativeEvent.pageX);
          let nextMin = minIdxRef.current;
          let nextMax = maxIdxRef.current;

          if (thumb === "min") {
            idx = Math.min(idx, maxIdxRef.current);
            nextMin = idx;
          } else {
            idx = Math.max(idx, minIdxRef.current);
            nextMax = idx;
          }

          if (nextMin !== minIdxRef.current || nextMax !== maxIdxRef.current) {
            hapticAt(thumb === "min" ? nextMin : nextMax);
            commit(nextMin, nextMax);
          }
        },
        onPanResponderRelease: () => {
          activeThumb.current = null;
          lastHapticIdx.current = null;
        },
        onPanResponderTerminate: () => {
          activeThumb.current = null;
          lastHapticIdx.current = null;
        },
      }),
    [commit, indexForPageX],
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    measureTrack();
  };

  const minAmount = stops[minIdx] ?? 0;
  const maxAmount = stops[maxIdx] ?? 0;
  const minLabel = formatValue(minAmount, "min");
  const maxLabel = formatValue(maxAmount, "max");
  const minX = xForIndex(minIdx);
  const maxX = xForIndex(maxIdx);

  // Subtle tick marks at each stop (Amazon-style full-range digits).
  const ticks =
    usableWidth > 0 && stops.length > 2
      ? stops.map((_, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              {
                left: xForIndex(i) + THUMB_SIZE / 2 - 0.5,
                opacity: i === minIdx || i === maxIdx ? 0 : i > minIdx && i < maxIdx ? 0.55 : 0.28,
              },
            ]}
          />
        ))
      : null;

  return (
    <View style={styles.root}>
      <View style={styles.labels}>
        <View style={styles.labelCard}>
          <Text style={styles.labelCaption}>Min</Text>
          <Text style={styles.labelValue} numberOfLines={1}>
            {minLabel}
          </Text>
        </View>
        <Text style={styles.dash}>–</Text>
        <View style={[styles.labelCard, styles.labelCardRight]}>
          <Text style={styles.labelCaption}>Max</Text>
          <Text style={styles.labelValue} numberOfLines={1}>
            {maxLabel}
          </Text>
        </View>
      </View>

      <View
        ref={trackRef}
        style={styles.trackWrap}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel ?? `Range from ${minLabel} to ${maxLabel}`}
      >
        <View style={styles.track} />
        {ticks}
        {usableWidth > 0 ? (
          <View
            style={[
              styles.trackActive,
              {
                left: minX + THUMB_SIZE / 2,
                width: Math.max(TRACK_HEIGHT, maxX - minX),
              },
            ]}
          />
        ) : null}
        {usableWidth > 0 ? (
          <>
            <View style={[styles.thumb, { left: minX }]} pointerEvents="none" />
            <View style={[styles.thumb, { left: maxX }]} pointerEvents="none" />
          </>
        ) : null}
      </View>

      <View style={styles.ends}>
        <Text style={styles.endLabel}>{endFormat(stops[0] || 0, "min")}</Text>
        <Text style={styles.endLabel}>{endFormat(stops[stops.length - 1] || 0, "max")}+</Text>
      </View>
    </View>
  );
}

/** @deprecated Use FilterRangeSlider */
export const PriceRangeSlider = FilterRangeSlider;

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  labels: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  labelCard: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  labelCardRight: {
    alignItems: "flex-end",
  },
  labelCaption: {
    ...type.caption,
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelValue: {
    ...type.emphasis,
    color: colors.ink,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  dash: {
    ...type.body,
    color: colors.inkMuted,
  },
  trackWrap: {
    height: THUMB_SIZE + HIT_SLOP * 2,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.borderStrong,
    marginHorizontal: THUMB_SIZE / 2,
  },
  tick: {
    position: "absolute",
    top: (THUMB_SIZE + HIT_SLOP * 2 - 8) / 2,
    width: 1,
    height: 8,
    backgroundColor: colors.inkMuted,
  },
  trackActive: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.accent,
    top: (THUMB_SIZE + HIT_SLOP * 2 - TRACK_HEIGHT) / 2,
  },
  thumb: {
    position: "absolute",
    top: HIT_SLOP,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.xs,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ends: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -spacing.xs,
  },
  endLabel: {
    ...type.caption,
    color: colors.inkMuted,
    fontVariant: ["tabular-nums"],
  },
});
