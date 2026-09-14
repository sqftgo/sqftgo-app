import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ChevronRight,
  FileCheck,
  MapPin,
  ShieldCheck,
} from "@/components/ui/icons";
import type { DirectoryProfile } from "@/data/types";
import { initialsFromName } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

/** Contact and profile card for brokers, consultants, and service partners. */
export function ExpertCard({ profile }: { profile: DirectoryProfile }) {
  const router = useRouter();

  const handleOpenProfile = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    router.push({
      pathname: "/broker/[id]",
      params: { id: profile.id },
    });
  };

  const initials = initialsFromName(profile.ownerName || profile.firmName);
  const exp = profile.experience || "5+ Years";

  return (
    <Pressable
      onPress={handleOpenProfile}
      accessibilityRole="button"
      accessibilityLabel={`${profile.ownerName}, ${profile.firmName}`}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.md,
        boxShadow: shadow.card,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {/* Header: Avatar + Info */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: colors.border,
          }}
        >
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ ...type.heading, color: colors.onPrimary, fontSize: 17, fontWeight: "700" }}>
              {initials}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text numberOfLines={1} style={{ ...type.emphasis, color: colors.ink, fontSize: 15, flex: 1 }}>
              {profile.ownerName}
            </Text>
            {profile.reraId ? (
              <ShieldCheck size={15} color={colors.success} strokeWidth={2.5} />
            ) : null}
          </View>

          <Text numberOfLines={1} style={{ ...type.caption, color: colors.inkSecondary }}>
            {profile.firmName} · <Text style={{ color: colors.accent }}>{profile.category}</Text>
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 1 }}>
            <MapPin size={11} color={colors.inkMuted} />
            <Text numberOfLines={1} style={{ ...type.micro, color: colors.inkMuted, flex: 1 }}>
              {profile.address ? `${profile.address}, ` : ""}{profile.city} · {exp}
            </Text>
          </View>
        </View>
      </View>

      {/* Specialties + RERA */}
      {profile.specialties && profile.specialties.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
          {profile.specialties.slice(0, 3).map((spec) => (
            <View
              key={spec}
              style={{
                backgroundColor: colors.surfaceSubtle,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ ...type.micro, color: colors.inkSecondary, fontWeight: "600" }}>
                {spec}
              </Text>
            </View>
          ))}
          {profile.reraId ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor: colors.successSoft,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: radius.sm,
              }}
            >
              <FileCheck size={10} color={colors.success} />
              <Text style={{ ...type.micro, color: colors.success, fontWeight: "700" }}>
                RERA
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Single CTA: View Profile */}
      <Pressable
        onPress={handleOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={`View ${profile.ownerName}'s profile`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs + 2,
          height: 40,
          borderRadius: radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: pressed ? colors.surfaceSubtle : colors.surface,
        })}
      >
        <Text style={{ ...type.label, color: colors.ink, fontWeight: "700" }}>
          View Profile
        </Text>
        <ChevronRight size={14} color={colors.ink} />
      </Pressable>
    </Pressable>
  );
}
