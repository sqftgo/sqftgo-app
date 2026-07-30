import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "lucide-react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { VisitStatus } from "@/data/types";
import { ownedPropertyIds, ownsVisit } from "@/lib/ownership";
import { VISIT_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const STATUS_STYLE: Record<VisitStatus, { bg: string; color: string }> = {
  pending: { bg: "rgba(255, 184, 0, 0.12)", color: "#B45309" },
  confirmed: { bg: colors.infoSoft, color: colors.info },
  completed: { bg: colors.successSoft, color: colors.success },
  cancelled: { bg: colors.surfaceSubtle, color: colors.inkMuted },
};

export default function ManageVisitsScreen() {
  const router = useRouter();
  const {
    visits,
    properties,
    userEmail,
    profile,
    canAccessDealerDashboard,
    updateVisitStatus,
  } = useApp();
  const [filter, setFilter] = useState<"open" | "all">("open");

  const ownedIds = useMemo(
    () => ownedPropertyIds(properties, { userId: profile?.id, email: userEmail }),
    [properties, profile?.id, userEmail],
  );

  const mine = useMemo(
    () => visits.filter((v) => ownsVisit(v, { email: userEmail, ownedPropertyIds: ownedIds })),
    [visits, userEmail, ownedIds],
  );

  const list = useMemo(() => {
    if (filter === "open") {
      return mine.filter((v) => v.status === "pending" || v.status === "confirmed");
    }
    return mine;
  }, [mine, filter]);

  if (!canAccessDealerDashboard) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={Calendar}
          title="Dealer access required"
          message="Visit management unlocks for approved brokers."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const setStatus = (id: string, status: VisitStatus) => {
    updateVisitStatus(id, status);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
        </Pressable>
        <Text style={{ ...type.title, color: colors.ink }}>Site visits</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Confirm, complete, or cancel buyer visit requests
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          marginHorizontal: spacing.xl,
          marginTop: spacing.md,
          backgroundColor: colors.surfaceSubtle,
          borderRadius: radius.md,
          padding: spacing.xs,
        }}
      >
        {(
          [
            { id: "open", label: "Open" },
            { id: "all", label: "All" },
          ] as const
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setFilter(tab.id)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: active ? colors.surface : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ ...type.label, color: active ? colors.ink : colors.inkMuted }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={Calendar}
            title="No visits"
            message="Buyers book visits from Active listings."
            actionLabel="Dashboard"
            onAction={() => router.push("/(tabs)/dashboard" as Href)}
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
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {item.buyerName} · {item.buyerEmail}
              </Text>
              <Text style={{ ...type.body, color: colors.ink }}>
                {item.visitDate} · {item.visitTime}
              </Text>
              {item.status === "pending" || item.status === "confirmed" ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {item.status === "pending" ? (
                    <Pressable
                      onPress={() => setStatus(item.id, "confirmed")}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        backgroundColor: colors.accent,
                      }}
                    >
                      <Text style={{ ...type.label, color: colors.onAccent }}>Confirm</Text>
                    </Pressable>
                  ) : null}
                  {item.status === "confirmed" ? (
                    <Pressable
                      onPress={() => setStatus(item.id, "completed")}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        backgroundColor: colors.success,
                      }}
                    >
                      <Text style={{ ...type.label, color: colors.onAccent }}>Complete</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      Alert.alert("Cancel visit", "Mark this visit as cancelled?", [
                        { text: "Keep", style: "cancel" },
                        {
                          text: "Cancel visit",
                          style: "destructive",
                          onPress: () => setStatus(item.id, "cancelled"),
                        },
                      ])
                    }
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
