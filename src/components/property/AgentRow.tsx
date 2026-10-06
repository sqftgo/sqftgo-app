import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import { ChevronRight, MessageSquare, Phone, type IconComponent } from "@/components/ui/icons";
import { initialsFromName } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

interface AgentRowProps {
  name: string;
  firm?: string;
  meta?: string;
  avatarUrl?: string;
  /** Omit when the lister has no public profile. */
  onPress?: () => void;
  onCall?: () => void;
  onChat?: () => void;
}

function ActionButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.accentBorder : colors.accentSoft,
      })}
    >
      <Icon size={18} color={colors.accent} />
    </Pressable>
  );
}

export function AgentRow({ name, firm, meta, avatarUrl, onPress, onCall, onChat }: AgentRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        boxShadow: shadow.card,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={onPress ? `View ${name}'s profile` : undefined}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48 }} contentFit="cover" />
          ) : (
            <Text style={{ ...type.emphasis, color: colors.onPrimary }}>{initialsFromName(name)}</Text>
          )}
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ ...type.emphasis, color: colors.ink, flexShrink: 1 }} numberOfLines={1}>
              {name}
            </Text>
            {onPress ? <ChevronRight size={14} color={colors.inkMuted} /> : null}
          </View>
          {firm ? (
            <Text style={{ ...type.caption, color: colors.inkSecondary }} numberOfLines={1}>
              {firm}
            </Text>
          ) : null}
          {meta ? (
            <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onCall || onChat ? (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {onCall ? <ActionButton icon={Phone} label={`Call ${name}`} onPress={onCall} /> : null}
          {onChat ? <ActionButton icon={MessageSquare} label={`WhatsApp ${name}`} onPress={onChat} /> : null}
        </View>
      ) : null}
    </View>
  );
}
