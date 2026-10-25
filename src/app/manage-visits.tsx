import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Linking, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { Screen } from "@/components/ds/Screen";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatusBadge } from "@/components/ds/StatusBadge";
import { toast } from "@/components/ds/Toast";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { VisitStatus } from "@/data/types";
import { ownedPropertyIds, ownsVisit } from "@/lib/ownership";
import { VISIT_STATUS_LABEL } from "@/lib/status-labels";
import { VISIT_BADGE_TONE } from "@/lib/status-tones";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

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
  const [busyId, setBusyId] = useState<string | null>(null);

  const ownedIds = useMemo(
    () => ownedPropertyIds(properties, { userId: profile?.id, email: userEmail }),
    [properties, profile?.id, userEmail],
  );

  const mine = useMemo(
    () => visits.filter((v) => ownsVisit(v, { email: userEmail, ownedPropertyIds: ownedIds })),
    [visits, userEmail, ownedIds],
  );

  const openCount = useMemo(
    () => mine.filter((v) => v.status === "pending" || v.status === "confirmed").length,
    [mine],
  );

  const list = useMemo(() => {
    if (filter === "open") {
      return mine.filter((v) => v.status === "pending" || v.status === "confirmed");
    }
    return mine;
  }, [mine, filter]);

  if (!canAccessDealerDashboard) {
    return (
      <Screen title="Site visits" fallbackHref={"/(dealer)" as Href}>
        <EmptyState
          icon={Calendar}
          title="Dealer access required"
          message="Visit management unlocks for approved brokers."
          actionLabel="Back to dashboard"
          onAction={() => router.replace("/(dealer)" as Href)}
        />
      </Screen>
    );
  }

  const setStatus = async (id: string, status: VisitStatus, successLabel: string) => {
    setBusyId(id);
    const result = await updateVisitStatus(id, status);
    setBusyId(null);
    if (!result.ok) {
      appAlert("Couldn't update visit", result.message ?? "Please try again.");
      return;
    }
    toast(successLabel);
  };

  return (
    <Screen
      title="Site visits"
      subtitle="Confirm, complete, or cancel buyer visit requests"
      scroll={false}
      fallbackHref={"/(dealer)" as Href}
      contentStyle={{ paddingHorizontal: 0, paddingTop: spacing.sm, gap: 0 }}
    >
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <SegmentedControl
          segments={[
            { value: "open", label: "Open", count: openCount },
            { value: "all", label: "All", count: mine.length },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["4xl"],
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={Calendar}
            title="No visits"
            message="Buyers book visits from Active listings."
            actionLabel="Dashboard"
            onAction={() => router.push("/(dealer)" as Href)}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.propertyTitle}
              </Text>
              <StatusBadge label={VISIT_STATUS_LABEL[item.status]} tone={VISIT_BADGE_TONE[item.status]} />
            </View>
            <Text style={styles.meta}>
              {item.buyerName} · {item.buyerEmail}
            </Text>
            <Text style={styles.when}>
              {item.visitDate} · {item.visitTime}
            </Text>
            {item.status === "pending" || item.status === "confirmed" ? (
              <View style={styles.actions}>
                {item.status === "pending" ? (
                  <Button
                    label="Confirm"
                    size="sm"
                    loading={busyId === item.id}
                    onPress={() => void setStatus(item.id, "confirmed", "Tour confirmed")}
                  />
                ) : null}
                {item.status === "confirmed" ? (
                  <Button
                    label="Complete"
                    size="sm"
                    loading={busyId === item.id}
                    onPress={() => void setStatus(item.id, "completed", "Visit completed")}
                  />
                ) : null}
                {item.buyerPhone ? (
                  <Button
                    label="Call"
                    size="sm"
                    variant="secondary"
                    onPress={() => void Linking.openURL(`tel:${item.buyerPhone}`)}
                  />
                ) : null}
                <Button
                  label="Cancel"
                  size="sm"
                  variant="secondary"
                  loading={busyId === item.id}
                  onPress={() =>
                    appAlert("Cancel visit", "Mark this visit as cancelled?", [
                      { text: "Keep", style: "cancel" },
                      {
                        text: "Cancel visit",
                        style: "destructive",
                        onPress: () => void setStatus(item.id, "cancelled", "Visit cancelled"),
                      },
                    ])
                  }
                />
              </View>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = {
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderCurve: "continuous" as const,
    padding: spacing.md,
    gap: spacing.sm,
    boxShadow: shadow.card,
  },
  cardHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: spacing.sm,
  },
  cardTitle: { ...type.emphasis, color: colors.ink, flex: 1 },
  meta: { ...type.caption, color: colors.inkMuted },
  when: { ...type.body, color: colors.ink },
  actions: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: spacing.sm },
};
