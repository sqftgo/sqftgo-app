import React from "react";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Building2,
  ChevronRight,
  FileCheck,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
} from "@/components/ui/icons";
import { appAlert } from "@/components/ui/app-alert";
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

  const handleCall = (e: any) => {
    e?.stopPropagation?.();
    if (!profile.mobile) return;
    Linking.openURL(`tel:${profile.mobile.replace(/\s/g, "")}`).catch(() => {
      appAlert("Unable to call", "Calls are not supported on this device.");
    });
  };

  const handleWhatsApp = (e: any) => {
    e?.stopPropagation?.();
    if (!profile.mobile) return;
    const cleanNumber = profile.mobile.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      `Hello ${profile.ownerName}, I found your verified profile on SqftGo and would like to inquire about properties.`,
    )}`;
    Linking.openURL(url).catch(() => {
      appAlert("Unable to open WhatsApp", "Please make sure WhatsApp is installed.");
    });
  };

  const initials = initialsFromName(profile.ownerName || profile.firmName);
  const rating = profile.rating || 4.9;
  const reviewsCount = profile.reviewsCount || 128;
  const exp = profile.experience || "5+ Years";
  const listingsCount = profile.listingsCount || 12;

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
        boxShadow: shadow.raised,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {/* Top Header: Avatar, Verified Badge, Rating */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
        {/* Avatar image or initials */}
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: colors.border,
            boxShadow: shadow.card,
          }}
        >
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ ...type.heading, color: colors.onPrimary, fontSize: 20, fontWeight: "700" }}>
              {initials}
            </Text>
          )}
        </View>

        {/* Firm Info & Agent Name */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text numberOfLines={1} style={{ ...type.emphasis, color: colors.ink, fontSize: 16, flex: 1 }}>
              {profile.firmName}
            </Text>
            {/* Rating pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: radius.sm,
              }}
            >
              <Star size={11} color="#D97706" fill="#D97706" />
              <Text style={{ ...type.micro, color: "#B45309", fontWeight: "700" }}>
                {rating}
              </Text>
            </View>
          </View>

          <Text style={{ ...type.caption, color: colors.inkSecondary, fontWeight: "600" }}>
            {profile.ownerName} · <Text style={{ color: colors.accent }}>{profile.category}</Text>
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 1 }}>
            <MapPin size={12} color={colors.inkMuted} />
            <Text numberOfLines={1} style={{ ...type.micro, color: colors.inkMuted, flex: 1 }}>
              {profile.address ? `${profile.address}, ` : ""}{profile.city}
            </Text>
          </View>
        </View>
      </View>

      {/* Specialties Tags */}
      {profile.specialties && profile.specialties.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {profile.specialties.slice(0, 3).map((spec) => (
            <View
              key={spec}
              style={{
                backgroundColor: colors.surfaceSubtle,
                paddingHorizontal: 8,
                paddingVertical: 3,
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
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radius.sm,
              }}
            >
              <ShieldCheck size={11} color={colors.success} strokeWidth={2.5} />
              <Text style={{ ...type.micro, color: colors.success, fontWeight: "700" }}>
                RERA Certified
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Metrics Row: Experience, Portfolio Listings, Verified Status */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceSubtle,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
          <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
            Experience
          </Text>
          <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
            {exp}
          </Text>
        </View>

        <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />

        <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
          <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
            Listings
          </Text>
          <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
            {listingsCount} Live
          </Text>
        </View>

        <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />

        <View style={{ flex: 1.1, alignItems: "center", gap: 1 }}>
          <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
            Reviews
          </Text>
          <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
            {reviewsCount} Happy
          </Text>
        </View>
      </View>

      {/* Direct Contact Actions: WhatsApp & Call */}
      <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 2 }}>
        <Pressable
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel={`Call ${profile.ownerName}`}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs + 2,
            height: 42,
            borderRadius: radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.borderStrong,
            backgroundColor: pressed ? colors.surfaceSubtle : colors.surface,
          })}
        >
          <Phone size={14} color={colors.ink} />
          <Text style={{ ...type.label, color: colors.ink, fontWeight: "700" }}>
            Call
          </Text>
        </Pressable>

        <Pressable
          onPress={handleWhatsApp}
          accessibilityRole="button"
          accessibilityLabel={`WhatsApp ${profile.ownerName}`}
          style={({ pressed }) => ({
            flex: 1.2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs + 2,
            height: 42,
            borderRadius: radius.md,
            borderCurve: "continuous",
            backgroundColor: colors.accent,
            boxShadow: shadow.button,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <MessageSquare size={15} color={colors.onAccent} />
          <Text style={{ ...type.label, color: colors.onAccent, fontWeight: "700" }}>
            WhatsApp
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

