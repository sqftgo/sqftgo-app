import React, { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageSquare } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { InquiryStatus } from "@/data/types";
import { INQUIRY_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const STATUS_STYLE: Record<InquiryStatus, { bg: string; color: string }> = {
  new: { bg: colors.infoSoft, color: colors.info },
  read: { bg: colors.successSoft, color: colors.success },
  archived: { bg: colors.surfaceSubtle, color: colors.inkMuted },
};

export default function MyInquiriesScreen() {
  const router = useRouter();
  const { inquiries, userEmail } = useApp();

  const mine = useMemo(
    () =>
      inquiries
        .filter((i) => i.buyerEmail.toLowerCase() === userEmail.toLowerCase())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [inquiries, userEmail],
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
        </Pressable>
        <Text style={{ ...type.title, color: colors.ink }}>My inquiries</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Messages you sent to dealers about properties
        </Text>
      </View>

      <FlatList
        data={mine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={MessageSquare}
            title="No inquiries yet"
            message="Ask about a listing from a property detail page."
            actionLabel="Explore"
            onAction={() => router.push("/(tabs)/explore" as Href)}
          />
        }
        renderItem={({ item }) => {
          const tone = STATUS_STYLE[item.status];
          return (
            <Pressable
              onPress={() => router.push(`/property/${item.propertyId}` as Href)}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                <Text style={{ ...type.emphasis, color: colors.ink, flex: 1 }} numberOfLines={2}>
                  {item.propertyTitle}
                </Text>
                <View
                  style={{
                    backgroundColor: tone.bg,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                    borderRadius: radius.sm,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ ...type.micro, fontWeight: "700", color: tone.color }}>
                    {INQUIRY_STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={{ ...type.body, color: colors.inkMuted }} numberOfLines={3}>
                {item.message}
              </Text>
              {item.replyMessage ? (
                <Text style={{ ...type.caption, color: colors.ink }}>
                  Dealer reply: {item.replyMessage}
                </Text>
              ) : null}
              <Text style={{ ...type.micro, color: colors.inkMuted }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
