/**
 * AppBar — Standardized, premium app bar for all primary tab screens.
 *
 * Design System:
 *  - Background: #FAF9F6 (cream) / dynamic via `backgroundColor` prop
 *  - Title: #0F1E36 @ 22 / weight 900 / tracking -0.5
 *  - Subtitle: #6B7280 @ 12.5 / weight 500
 *  - Icon buttons: 38×38 circles, border #EAE9E4, bg #FFFFFF
 *  - Accent: #E05A36
 *  - Bottom separator: 1px #EAE9E4
 */
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

export interface AppBarAction {
  /** Any renderable icon element */
  icon: React.ReactElement;
  onPress: () => void;
  /** Accessible label for the button */
  label: string;
  /** Optional: show a small red dot badge on the icon */
  badge?: boolean;
  /** Optional: override the icon button background */
  bgColor?: string;
}

interface AppBarProps {
  title: string;
  subtitle?: string;
  /** Right-side action buttons (max 2 recommended) */
  actions?: AppBarAction[];
  /** Override the entire bar background */
  backgroundColor?: string;
  /** Override the title color (for dark-mode aware screens) */
  titleColor?: string;
  /** Override the subtitle color */
  subtitleColor?: string;
  /** Override the border color */
  borderColor?: string;
  /** Optional left element (avatar, logo, etc.) */
  leftElement?: React.ReactElement;
}

export default function AppBar({
  title,
  subtitle,
  actions = [],
  backgroundColor = colors.bg,
  titleColor = colors.ink,
  subtitleColor = colors.inkMuted,
  borderColor = colors.border,
  leftElement,
}: AppBarProps) {
  return (
    <View style={[styles.container, { backgroundColor, borderBottomColor: borderColor }]}>
      {/* Left: optional icon / logo */}
      <View style={styles.left}>
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Right: action icon buttons */}
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, idx) => (
            <Pressable
              key={idx}
              onPress={action.onPress}
              accessibilityLabel={action.label}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: action.bgColor ?? colors.surface, borderColor },
                pressed && styles.iconBtnPressed,
              ]}
            >
              {action.icon}
              {action.badge && <View style={styles.badgeDot} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 12,
  },
  leftElement: {
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  } as any,
  iconBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  badgeDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
