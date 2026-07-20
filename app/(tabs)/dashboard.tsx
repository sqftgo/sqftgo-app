import React, { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle2,
  ClipboardList,
  FileEdit,
  Inbox,
  Plus,
} from "lucide-react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { formatPriceWithPeriod } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const STATUS_TONE: Record<
  Property["status"],
  { bg: string; color: string; label: string }
> = {
  Draft: { bg: colors.surfaceSubtle, color: colors.inkMuted, label: "Draft" },
  "Pending Review": { bg: "rgba(255, 184, 0, 0.12)", color: "#B45309", label: "Pending" },
  Active: { bg: colors.successSoft, color: colors.success, label: "Active" },
  Sold: { bg: colors.infoSoft, color: colors.info, label: "Sold" },
  Rented: { bg: colors.infoSoft, color: colors.info, label: "Rented" },
};

export default function DashboardScreen() {
  const router = useRouter();
  const { properties, inquiries, userEmail } = useApp();

  const mine = useMemo(
    () => properties.filter((p) => p.brokerEmail === userEmail),
    [properties, userEmail],
  );

  const openInquiries = useMemo(
    () => inquiries.filter((i) => i.brokerEmail === userEmail && i.status === "open").length,
    [inquiries, userEmail],
  );

  const counts = useMemo(
    () => ({
      draft: mine.filter((p) => p.status === "Draft").length,
      active: mine.filter((p) => p.status === "Active").length,
    }),
    [mine],
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Text style={{ ...type.title, color: colors.ink }}>Dashboard</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Your listings and buyer inquiries
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
        }}
      >
        {[
          { label: "Draft", value: counts.draft, Icon: FileEdit },
          { label: "Active", value: counts.active, Icon: CheckCircle2 },
          { label: "Open inquiries", value: openInquiries, Icon: Inbox },
        ].map((stat) => (
          <View
            key={stat.label}
            style={{
              width: "48%",
              flexGrow: 1,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              padding: spacing.md,
              gap: spacing.xs,
              boxShadow: shadow.card,
            }}
          >
            <stat.Icon size={16} color={colors.accent} />
            <Text style={{ ...type.heading, color: colors.ink }}>{stat.value}</Text>
            <Text style={{ ...type.caption, color: colors.inkMuted }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => router.push("/post-property")}
        style={({ pressed }) => ({
          marginHorizontal: spacing.xl,
          marginTop: spacing.lg,
          height: 48,
          borderRadius: radius.md,
          borderCurve: "continuous",
          backgroundColor: colors.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
          boxShadow: shadow.accent,
        })}
      >
        <Plus size={18} color={colors.onAccent} />
        <Text style={{ ...type.emphasis, color: colors.onAccent }}>Add property</Text>
      </Pressable>

      <FlatList
        data={mine}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
            MY LISTINGS
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon={ClipboardList}
            title="No listings yet"
            message="Save a draft or publish a property to go live on the marketplace."
            actionLabel="Add property"
            onAction={() => router.push("/post-property")}
          />
        }
        renderItem={({ item }) => {
          const tone = STATUS_TONE[item.status] ?? STATUS_TONE.Active;
          return (
            <Pressable
              onPress={() => router.push(`/property/${item.id}`)}
              style={({ pressed }) => ({
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.md,
                gap: spacing.xs,
                opacity: pressed ? 0.9 : 1,
                boxShadow: shadow.card,
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Text style={{ ...type.emphasis, color: colors.ink, flex: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
                <View
                  style={{
                    backgroundColor: tone.bg,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: radius.full,
                  }}
                >
                  <Text style={{ ...type.micro, color: tone.color, fontWeight: "700" }}>
                    {tone.label}
                  </Text>
                </View>
              </View>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {item.locality}, {item.city} · {formatPriceWithPeriod(item.price, item.purpose)}
              </Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {item.inquiryCount} inquir{item.inquiryCount === 1 ? "y" : "ies"}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
