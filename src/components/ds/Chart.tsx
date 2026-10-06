import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { colors, radius, spacing, type } from "@/theme/tokens";

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

const PALETTE = [colors.accent, colors.primary, colors.success, colors.gold, colors.info, colors.inkMuted];

/** Horizontal bars — readable at phone width and with long labels, unlike vertical columns. */
export function BarChart({ data, format = String }: { data: ChartDatum[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.bars} accessibilityRole="summary">
      {data.map((d, i) => (
        <View key={d.label} style={styles.barRow} accessible accessibilityLabel={`${d.label}: ${format(d.value)}`}>
          <View style={styles.barHead}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={styles.barValue}>{format(d.value)}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? PALETTE[i % PALETTE.length] },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Share-of-total ring with a legend. Totals of zero render an empty ring. */
export function DonutChart({
  data,
  size = 140,
  thickness = 18,
  centerLabel,
}: {
  data: ChartDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <View style={styles.donut}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceSubtle} strokeWidth={thickness} fill="none" />
            {total > 0
              ? data.map((d, i) => {
                  const len = (d.value / total) * c;
                  const seg = (
                    <Circle
                      key={d.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      stroke={d.color ?? PALETTE[i % PALETTE.length]}
                      strokeWidth={thickness}
                      strokeDasharray={`${len} ${c - len}`}
                      strokeDashoffset={-offset}
                      fill="none"
                    />
                  );
                  offset += len;
                  return seg;
                })
              : null}
          </G>
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.total}>{total}</Text>
          {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
        </View>
      </View>
      <View style={styles.legend}>
        {data.map((d, i) => (
          <View key={d.label} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: d.color ?? PALETTE[i % PALETTE.length] }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={styles.legendValue}>{d.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { gap: spacing.md },
  barRow: { gap: spacing.xs },
  barHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  barLabel: { ...type.caption, color: colors.inkSecondary, flexShrink: 1 },
  barValue: { ...type.caption, color: colors.ink, fontVariant: ["tabular-nums"] },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceSubtle, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full },
  donut: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  center: { alignItems: "center", justifyContent: "center" },
  total: { ...type.title, color: colors.ink, fontVariant: ["tabular-nums"] },
  centerLabel: { ...type.micro, color: colors.inkMuted },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { ...type.caption, color: colors.inkSecondary, flex: 1 },
  legendValue: { ...type.caption, color: colors.ink, fontVariant: ["tabular-nums"] },
});
