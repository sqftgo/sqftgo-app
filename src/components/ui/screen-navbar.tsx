import React from "react";
import { Pressable, Text, View } from "react-native";

import { ChevronDown, ChevronLeft, type IconComponent } from "@/components/ui/icons";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export interface HeaderAction {
  icon: IconComponent;
  onPress: () => void;
  /** Accessible label (required — icon-only button). */
  label: string;
  /** `true` shows a dot, a number > 0 shows a count. */
  badge?: boolean | number;
  tone?: "default" | "accent";
}

export interface ScreenNavbarProps {
  title: string;
  /** Small label above the title (e.g. greeting on Home). */
  eyebrow?: string;
  subtitle?: string;
  /** Renders a back button on the left. */
  onBack?: () => void;
  /** Uniform circular icon buttons on the right. */
  actions?: HeaderAction[];
  /** Custom right-side control, rendered before `actions`. */
  rightAction?: React.ReactNode;
  /** Makes the title pressable and shows a chevron (e.g. city picker). */
  onPressTitle?: () => void;
}

const BUTTON_SIZE = 40;

export function HeaderIconButton({
  icon: Icon,
  onPress,
  label,
  badge,
  tone = "default",
}: HeaderAction) {
  const accent = tone === "accent";
  const count = typeof badge === "number" ? badge : 0;
  const showDot = badge === true;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `${label}, ${count}` : label}
      style={({ pressed }) => ({
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: accent ? colors.accent : colors.surface,
        borderWidth: accent ? 0 : 1,
        borderColor: colors.border,
        boxShadow: shadow.card,
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Icon size={19} color={accent ? colors.onAccent : colors.ink} strokeWidth={1.8} />
      {count > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: radius.full,
            backgroundColor: colors.accent,
            borderWidth: 2,
            borderColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...type.micro, fontSize: 9, lineHeight: 11, color: colors.onAccent }}>
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      ) : showDot ? (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 9,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accent,
            borderWidth: 1.5,
            borderColor: colors.surface,
          }}
        />
      ) : null}
    </Pressable>
  );
}

export interface HeaderPillButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  /** Shows a trailing chevron (dropdown affordance). */
  dropdown?: boolean;
  accessibilityLabel?: string;
}

/** Text pill sized to sit next to `HeaderIconButton`s (city picker, filters). */
export function HeaderPillButton({
  label,
  onPress,
  icon: Icon,
  dropdown,
  accessibilityLabel,
}: HeaderPillButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        height: BUTTON_SIZE,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        boxShadow: shadow.card,
        maxWidth: 150,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {Icon ? <Icon size={15} color={colors.accent} /> : null}
      <Text
        style={{ ...type.label, fontWeight: "600", color: colors.ink, flexShrink: 1 }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {dropdown ? <ChevronDown size={14} color={colors.inkMuted} /> : null}
    </Pressable>
  );
}

/**
 * Shared screen app bar: one-line title, optional back button and uniform icon actions.
 * Place inside ScrollView / FlatList `ListHeaderComponent` so it scrolls away,
 * or above the list for a pinned header.
 */
export function ScreenNavbar({
  title,
  eyebrow,
  subtitle,
  onBack,
  actions,
  rightAction,
  onPressTitle,
}: ScreenNavbarProps) {
  const titleBlock = (
    <View style={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
      {eyebrow ? (
        <Text
          style={{ ...type.caption, color: colors.inkMuted, fontWeight: "500" }}
          numberOfLines={1}
        >
          {eyebrow}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Text
          style={{
            ...type.hero,
            fontSize: onBack ? 20 : 24,
            lineHeight: onBack ? 26 : 30,
            color: colors.ink,
            flexShrink: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {onPressTitle ? <ChevronDown size={18} color={colors.ink} strokeWidth={2.2} /> : null}
      </View>
      {subtitle ? (
        <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  const hasRight = Boolean(rightAction) || Boolean(actions?.length);

  return (
    <View
      style={{
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      {onBack ? (
        <HeaderIconButton icon={ChevronLeft} label="Go back" onPress={onBack} />
      ) : null}
      {onPressTitle ? (
        <Pressable
          onPress={onPressTitle}
          accessibilityRole="button"
          style={({ pressed }) => ({ flex: 1, minWidth: 0, opacity: pressed ? 0.7 : 1 })}
        >
          {titleBlock}
        </Pressable>
      ) : (
        titleBlock
      )}
      {hasRight ? (
        <View style={{ flexShrink: 0, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {rightAction}
          {actions?.map((action) => (
            <HeaderIconButton key={action.label} {...action} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
