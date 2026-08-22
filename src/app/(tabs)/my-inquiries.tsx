import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageSquare } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
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
    () => inquiries.filter((i) => i.buyerEmail.toLowerCase() === userEmail.toLowerCase()),
    [inquiries, userEmail],
  );

  const subtitle =
    mine.length === 0
      ? "Track messages you send to dealers"
      : `${mine.length} inquir${mine.length === 1 ? "y" : "ies"}`;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={mine}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <ScreenNavbar eyebrow="Buyer inbox" title="My Inquiries" subtitle={subtitle} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={MessageSquare}
            title="No inquiries yet"
            message="Open an Active listing and submit an inquiry to contact the dealer."
            actionLabel="Explore homes"
            onAction={() => router.push("/(tabs)/explore")}
          />
        }
        renderItem={({ item }) => {
          const tone = STATUS_STYLE[item.status];
          return (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.md,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
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
                  {item.propertyTitle}
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
                    {INQUIRY_STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={{ ...type.body, color: colors.inkSecondary }}>{item.message}</Text>
              {item.replyMessage ? (
                <View
                  style={{
                    backgroundColor: colors.successSoft,
                    borderRadius: radius.md,
                    padding: spacing.sm,
                    gap: 2,
                  }}
                >
                  <Text style={{ ...type.micro, color: colors.success, fontWeight: "700" }}>
                    DEALER REPLY
                  </Text>
                  <Text style={{ ...type.caption, color: colors.ink }}>{item.replyMessage}</Text>
                </View>
              ) : null}
              <Text style={{ ...type.micro, color: colors.inkMuted }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
