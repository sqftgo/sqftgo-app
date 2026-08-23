import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2, MessageSquare, Plus, ShieldCheck } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import { ownsProperty } from "@/lib/ownership";
import { initialsFromName } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function listingLabel(status?: string) {
  switch (status) {
    case "approved":
      return "Verified by Admin";
    case "pending":
      return "Pending admin review";
    case "rejected":
      return "Listing access declined";
    default:
      return "Not listed yet";
  }
}

export default function MyListingsScreen() {
  const router = useRouter();
  const { properties, inquiries, profile, userEmail, userName } = useApp();

  const mine = useMemo(
    () => properties.filter((p) => ownsProperty(p, { userId: profile?.id, email: userEmail })),
    [properties, profile?.id, userEmail],
  );

  const ownedIds = useMemo(() => new Set(mine.map((p) => p.id)), [mine]);
  const leads = useMemo(
    () => inquiries.filter((i) => ownedIds.has(i.propertyId) && i.status !== "archived"),
    [inquiries, ownedIds],
  );

  const remaining = Math.max(0, 2 - mine.filter((p) => p.status !== "Rejected").length);
  const canAdd = remaining > 0 && profile?.listingStatus !== "rejected";
  const initials = initialsFromName(userName || userEmail);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
        </Pressable>

        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.md,
            boxShadow: shadow.card,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={{ width: 64, height: 64 }} />
              ) : (
                <Text style={{ ...type.title, color: colors.onPrimary }}>{initials}</Text>
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ ...type.heading, color: colors.ink }} numberOfLines={1}>
                {userName || "Your profile"}
              </Text>
              <Text selectable style={{ ...type.caption, color: colors.inkMuted }}>
                {userEmail}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={14} color={colors.success} />
                <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
                  {listingLabel(profile?.listingStatus)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={{ ...type.caption, color: colors.inkMuted }}>
            Up to 2 listings. Admin reviews each one. Include nearest hospital, school, and
            transportation.
          </Text>
          {canAdd ? (
            <Pressable
              onPress={() => router.push("/post-property")}
              style={{
                backgroundColor: colors.accent,
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Plus size={16} color={colors.onPrimary} />
              <Text style={{ ...type.label, color: colors.onPrimary }}>Add property</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={{ ...type.label, color: colors.inkMuted }}>MY PROPERTIES ({mine.length})</Text>
        {mine.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            message="List a home, plot, or commercial space. It stays private until admin approves it."
            actionLabel="List a property"
            onAction={() => router.push("/post-property")}
          />
        ) : (
          mine.map((prop) => (
            <Pressable
              key={prop.id}
              onPress={() =>
                prop.status === "Active"
                  ? router.push(`/property/${prop.id}`)
                  : router.push(`/edit-property/${prop.id}`)
              }
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: 4,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.ink }}>{prop.title}</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {prop.locality}, {prop.city} · {prop.status}
              </Text>
            </Pressable>
          ))
        )}

        <Text style={{ ...type.label, color: colors.inkMuted }}>
          INQUIRIES ON YOUR LISTINGS ({leads.length})
        </Text>
        {leads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No buyer inquiries yet"
            message="When someone messages you about an Active listing, it shows up here."
          />
        ) : (
          leads.map((lead) => (
            <View
              key={lead.id}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: 4,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.ink }}>{lead.buyerName}</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {lead.propertyTitle} · {lead.buyerEmail}
              </Text>
              <Text style={{ ...type.body, color: colors.ink }}>{lead.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
