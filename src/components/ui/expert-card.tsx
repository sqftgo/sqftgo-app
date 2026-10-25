import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Building2,
  ChevronRight,
  FileCheck,
  MapPin,
  ShieldCheck,
  User,
} from "@/components/ui/icons";
import type { DirectoryProfile } from "@/data/types";
import { initialsFromName } from "@/lib/format";
import { isDirectoryVerified, isServiceDirectoryCategory } from "@/lib/is-dealer-category";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

/** Avoid "Ratanada, Jodhpur, Jodhpur" when address already ends with the city. */
function formatPlace(address?: string | null, city?: string | null): string {
  const c = (city ?? "").trim();
  let a = (address ?? "").trim();
  if (!a && !c) return "";
  if (!a) return c;
  if (!c) return a;
  const cityRe = new RegExp(`[\\s,]*${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  a = a.replace(cityRe, "").replace(/[,\s]+$/, "").trim();
  return a ? `${a}, ${c}` : c;
}

function MetaChip({
  label,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  tone?: "neutral" | "accent" | "success";
  icon?: React.ComponentType<{ size?: number; color?: string }>;
}) {
  const bg =
    tone === "accent" ? colors.accentSoft : tone === "success" ? colors.successSoft : colors.surfaceSubtle;
  const fg = tone === "accent" ? colors.accent : tone === "success" ? colors.success : colors.inkSecondary;
  const border =
    tone === "accent" ? colors.accentBorder : tone === "success" ? "transparent" : colors.border;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: bg,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: radius.sm,
        borderCurve: "continuous",
        borderWidth: tone === "success" ? 0 : 1,
        borderColor: border,
      }}
    >
      {Icon ? <Icon size={10} color={fg} /> : null}
      <Text style={{ ...type.micro, color: fg, fontWeight: "700" }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Directory card for dealers and service partners.
 * Business / firm name leads; the person is shown as owner/contact — not the headline.
 */
export function ExpertCard({
  profile,
  variant = "full",
}: {
  profile: DirectoryProfile;
  variant?: "full" | "compact";
}) {
  const router = useRouter();

  const isService = isServiceDirectoryCategory(profile.category);
  const verified = isDirectoryVerified(profile);
  const firm = (profile.firmName || profile.ownerName).trim();
  const owner = (profile.ownerName || "").trim();
  const showOwner = Boolean(owner && owner.toLowerCase() !== firm.toLowerCase());
  const initials = initialsFromName(firm);
  const place = useMemo(
    () => formatPlace(profile.address, profile.city),
    [profile.address, profile.city],
  );
  const tags = isService
    ? (profile.servicesOffered?.length ? profile.servicesOffered : profile.specialties) ?? []
    : profile.specialties ?? [];
  const listings =
    typeof profile.listingsCount === "number" && profile.listingsCount > 0
      ? profile.listingsCount
      : null;
  const experience = profile.experience?.trim() || null;
  const ownerLabel = isService ? "Contact" : "Owner";

  const handleOpenProfile = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    router.push({
      pathname: isService ? "/service/[id]" : "/broker/[id]",
      params: { id: profile.id },
    });
  };

  const a11y = [firm, showOwner ? `${ownerLabel} ${owner}` : null, profile.category, place, verified ? "Verified" : null]
    .filter(Boolean)
    .join(", ");

  if (variant === "compact") {
    return (
      <Pressable
        onPress={handleOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => ({
          width: 240,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm + 2,
          boxShadow: shadow.card,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 }}>
          <Avatar uri={profile.avatarUrl || profile.logoUrl} initials={initials} size={44} r={radius.sm} />
          <View style={{ flex: 1, gap: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text numberOfLines={1} style={{ ...type.emphasis, color: colors.ink, flexShrink: 1 }}>
                {firm}
              </Text>
              {verified ? <ShieldCheck size={13} color={colors.success} strokeWidth={2.5} /> : null}
            </View>
            {showOwner ? (
              <Text numberOfLines={1} style={{ ...type.caption, color: colors.inkSecondary }}>
                {owner}
              </Text>
            ) : null}
          </View>
        </View>

        <MetaChip label={profile.category} tone="accent" />

        {place ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <MapPin size={12} color={colors.inkMuted} />
            <Text numberOfLines={1} style={{ ...type.caption, color: colors.inkMuted, flex: 1 }}>
              {place}
            </Text>
            <ChevronRight size={14} color={colors.inkMuted} />
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handleOpenProfile}
      accessibilityRole="button"
      accessibilityLabel={a11y}
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
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
        <Avatar uri={profile.avatarUrl || profile.logoUrl} initials={initials} size={52} r={radius.lg} />

        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Text
              numberOfLines={2}
              style={{ ...type.emphasis, color: colors.ink, fontSize: 16, flex: 1, lineHeight: 21 }}
            >
              {firm}
            </Text>
            {verified ? <ShieldCheck size={16} color={colors.success} strokeWidth={2.5} /> : null}
          </View>

          {showOwner ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <User size={12} color={colors.inkMuted} />
              <Text numberOfLines={1} style={{ ...type.caption, color: colors.inkSecondary, flex: 1 }}>
                {ownerLabel} · {owner}
              </Text>
            </View>
          ) : null}

          {place ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <MapPin size={12} color={colors.inkMuted} />
              <Text numberOfLines={1} style={{ ...type.caption, color: colors.inkMuted, flex: 1 }}>
                {place}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <MetaChip label={profile.category} tone="accent" />
        {verified ? <MetaChip label="Verified" tone="success" icon={ShieldCheck} /> : null}
        {!isService && profile.reraId ? (
          <MetaChip label="RERA" tone="success" icon={FileCheck} />
        ) : null}
        {experience ? <MetaChip label={experience} /> : null}
        {listings != null ? (
          <MetaChip
            label={listings === 1 ? "1 listing" : `${listings} listings`}
            icon={Building2}
          />
        ) : null}
        {tags.slice(0, 2).map((spec) => (
          <MetaChip key={spec} label={spec} />
        ))}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs + 2,
          height: 42,
          borderRadius: radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surfaceSubtle,
        }}
      >
        <Text style={{ ...type.label, color: colors.ink, fontWeight: "700" }}>
          {isService ? "View service profile" : "View dealer profile"}
        </Text>
        <ChevronRight size={14} color={colors.ink} />
      </View>
    </Pressable>
  );
}

function Avatar({
  uri,
  initials,
  size,
  r,
}: {
  uri?: string | null;
  initials: string;
  size: number;
  r: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        borderCurve: "continuous",
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: colors.border,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <Text
          style={{
            ...type.emphasis,
            color: colors.onPrimary,
            fontSize: size > 48 ? 16 : 13,
            fontWeight: "700",
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
