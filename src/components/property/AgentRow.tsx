import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import {
  ChevronRight,
  MessageSquare,
  Phone,
  ShieldCheck,
  type IconComponent,
} from "@/components/ui/icons";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

interface AgentRowProps {
  name: string;
  firm: string;
  meta: string;
  avatarUrl: string;
  onPress: () => void;
  onCall: () => void;
  onChat: () => void;
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
        width: 40,
        height: 40,
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
        accessibilityRole="button"
        accessibilityLabel={`View ${name}'s profile`}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 48, height: 48, borderRadius: radius.full }}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ ...type.emphasis, color: colors.ink, flexShrink: 1 }} numberOfLines={1}>
              {name}
            </Text>
            <ShieldCheck size={14} color={colors.success} />
            <ChevronRight size={14} color={colors.inkMuted} />
          </View>
          <Text style={{ ...type.caption, color: colors.inkSecondary }} numberOfLines={1}>
            {firm}
          </Text>
          <Text style={{ ...type.caption, fontSize: 11, color: colors.inkMuted }} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <ActionButton icon={Phone} label={`Call ${name}`} onPress={onCall} />
        <ActionButton icon={MessageSquare} label={`WhatsApp ${name}`} onPress={onChat} />
      </View>
    </View>
  );
}
