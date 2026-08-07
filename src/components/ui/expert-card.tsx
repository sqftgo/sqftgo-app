import React from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { Mail, Phone, ShieldCheck } from "@/components/ui/icons";

import type { DirectoryProfile } from "@/data/types";
import { initialsFromName } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

/** Contact card for brokers, consultants, and service partners. */
export function ExpertCard({ profile }: { profile: DirectoryProfile }) {
  const handleCall = () => {
    Linking.openURL(`tel:${profile.mobile.replace(/\s/g, "")}`).catch(() => {
      Alert.alert("Unable to call", "Calls are not supported on this device.");
    });
  };

  const handleEmail = () => {
    Linking.openURL(
      `mailto:${profile.email}?subject=${encodeURIComponent(`Inquiry: ${profile.firmName}`)}`,
    ).catch(() => {
      Alert.alert("Unable to email", "No email app is configured on this device.");
    });
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.md,
        boxShadow: shadow.card,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.full,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...type.label, color: colors.accent }}>
            {initialsFromName(profile.ownerName)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text numberOfLines={1} style={{ ...type.emphasis, color: colors.ink }}>
            {profile.firmName}
          </Text>
          <Text style={{ ...type.caption, color: colors.inkMuted }}>
            {profile.category} · {profile.city}
          </Text>
        </View>
        {profile.reraId && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: colors.successSoft,
              paddingHorizontal: spacing.sm - 2,
              paddingVertical: 3,
              borderRadius: radius.sm,
              borderCurve: "continuous",
            }}
          >
            <ShieldCheck size={11} color={colors.success} />
            <Text style={{ ...type.micro, color: colors.success }}>Certified</Text>
          </View>
        )}
      </View>

      <Text numberOfLines={2} style={{ ...type.caption, color: colors.inkSecondary }}>
        {profile.description}
      </Text>

      <View style={{ flexDirection: "row", gap: spacing.lg }}>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          {profile.experience ?? "5+ Years"}
        </Text>
        {profile.listingsCount != null && (
          <Text style={{ ...type.caption, color: colors.inkMuted }}>
            {profile.listingsCount} listings
          </Text>
        )}
        {profile.reraId && (
          <Text selectable numberOfLines={1} style={{ ...type.caption, color: colors.inkMuted, flex: 1 }}>
            {profile.reraId}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Pressable
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel={`Call ${profile.firmName}`}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs,
            height: 40,
            borderRadius: radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.accentBorder,
            backgroundColor: pressed ? colors.accentSoft : colors.surface,
          })}
        >
          <Phone size={14} color={colors.accent} />
          <Text style={{ ...type.label, color: colors.accent }}>Call</Text>
        </Pressable>
        <Pressable
          onPress={handleEmail}
          accessibilityRole="button"
          accessibilityLabel={`Email ${profile.firmName}`}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs,
            height: 40,
            borderRadius: radius.md,
            borderCurve: "continuous",
            backgroundColor: colors.accent,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Mail size={14} color={colors.onAccent} />
          <Text style={{ ...type.label, color: colors.onAccent }}>Email</Text>
        </Pressable>
      </View>
    </View>
  );
}
