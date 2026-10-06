import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { ChevronRight, type IconComponent } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Right-aligned value text (e.g. "On", "3", "Pending"). */
  value?: string;
  icon?: IconComponent;
  iconTint?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Custom right accessory (switch, badge). Replaces chevron. */
  accessory?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}

export function ListRow({
  title,
  subtitle,
  value,
  icon: Icon,
  iconTint,
  onPress,
  destructive,
  accessory,
  showChevron,
  disabled,
}: ListRowProps) {
  const tint = destructive ? colors.danger : (iconTint ?? colors.primary);
  const chevron = showChevron ?? (Boolean(onPress) && !accessory);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(", ")}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? { backgroundColor: colors.surfaceSubtle } : null,
        disabled && { opacity: 0.5 },
      ]}
    >
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft }]}>
          <Icon size={18} color={tint} strokeWidth={1.8} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={[styles.title, destructive && { color: colors.danger }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {accessory}
      {chevron ? <ChevronRight size={18} color={colors.placeholder} /> : null}
    </Pressable>
  );
}

/** iOS-style inset grouped section with hairline separators. */
export function ListSection({
  title,
  footer,
  children,
  style,
}: {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.card}>
        {items.map((child, i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.separator} /> : null}
            {child}
          </View>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  title: { ...type.body, color: colors.ink },
  subtitle: { ...type.caption, color: colors.inkMuted },
  value: { ...type.body, color: colors.inkMuted, maxWidth: 140 },
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
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 60 },
  footer: { ...type.caption, color: colors.inkMuted, paddingHorizontal: spacing.lg },
});
