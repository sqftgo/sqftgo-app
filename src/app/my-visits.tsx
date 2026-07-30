import React, { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "lucide-react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { VisitStatus } from "@/data/types";
import { VISIT_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const STATUS_STYLE: Record<VisitStatus, { bg: string; color: string }> = {
  pending: { bg: "rgba(255, 184, 0, 0.12)", color: "#B45309" },
  confirmed: { bg: colors.infoSoft, color: colors.info },
  completed: { bg: colors.successSoft, color: colors.success },
  cancelled: { bg: colors.surfaceSubtle, color: colors.inkMuted },
};

export default function MyVisitsScreen() {
  const router = useRouter();
  const { visits, userEmail } = useApp();

  const mine = useMemo(
    () => visits.filter((v) => v.buyerEmail.toLowerCase() === userEmail.toLowerCase()),
    [visits, userEmail],
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
        </Pressable>
        <Text style={{ ...type.title, color: colors.ink }}>My visits</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Track site visit requests and dealer responses
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
            icon={Calendar}
            title="No visits yet"
            message="Book a visit from an Active property detail page."
            actionLabel="Explore"
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
                    paddingVertical: 2,
                    borderRadius: radius.full,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ ...type.micro, color: tone.color, fontWeight: "700" }}>
                    {VISIT_STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={{ ...type.body, color: colors.ink }}>
                {item.visitDate} · {item.visitTime}
              </Text>
              <Text style={{ ...type.micro, color: colors.inkMuted }}>
                Requested {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
