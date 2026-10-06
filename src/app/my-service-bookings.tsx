import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { Button, EmptyState, ErrorState, ListSkeleton, Screen, StatusBadge, toast, type BadgeTone } from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Briefcase } from "@/components/ui/icons";
import { isApiMode } from "@/lib/api/config";
import {
  apiCancelServiceBooking,
  apiListMyServiceBookings,
  type ServiceBooking,
  type ServiceBookingStatus,
} from "@/lib/api/services/services";
import { colors, radius, spacing, type } from "@/theme/tokens";

const STATUS: Record<ServiceBookingStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Awaiting partner", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  completed: { label: "Completed", tone: "info" },
};

const KEY = ["service-bookings", "mine"];

export default function MyServiceBookingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: apiListMyServiceBookings, enabled: isApiMode });

  const cancel = useMutation({
    mutationFn: (id: string) => apiCancelServiceBooking(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<ServiceBooking[]>(KEY, (prev) => prev?.map((b) => (b.id === updated.id ? updated : b)));
      toast("Booking cancelled");
    },
    onError: (e) => appAlert("Couldn't cancel", e instanceof Error ? e.message : "Try again."),
  });

  const confirmCancel = (item: ServiceBooking) =>
    appAlert("Cancel this request?", `${item.firmName ?? "The partner"} will be told you no longer need the visit.`, [
      { text: "Keep", style: "cancel" },
      { text: "Cancel request", style: "destructive", onPress: () => cancel.mutate(item.id) },
    ]);

  const empty = !isApiMode ? (
    <EmptyState icon={Briefcase} title="Bookings need a connection" message="Service bookings sync from SqftGo servers." />
  ) : query.isLoading ? (
    <ListSkeleton rows={3} />
  ) : query.isError ? (
    <ErrorState onRetry={() => void query.refetch()} />
  ) : (
    <EmptyState
      icon={Briefcase}
      title="No bookings yet"
      message="Book a visit from any service partner's profile and track it here."
      actionLabel="Browse services"
      onAction={() => router.push("/(tabs)/services")}
    />
  );

  return (
    <Screen title="Service bookings" subtitle="Requests you sent to partners" scroll={false} fallbackHref="/(tabs)/services">
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        refreshing={query.isRefetching}
        onRefresh={isApiMode ? () => void query.refetch() : undefined}
        contentContainerStyle={styles.list}
        ListEmptyComponent={empty}
        renderItem={({ item }) => {
          const meta = STATUS[item.status] ?? STATUS.pending;
          const open = item.status === "pending" || item.status === "confirmed";
          return (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.firm} numberOfLines={1}>
                  {item.firmName || "Service partner"}
                </Text>
                <StatusBadge label={meta.label} tone={meta.tone} />
              </View>
              <Text style={styles.meta}>
                {[
                  item.city,
                  new Date(item.preferredAt).toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {item.message ? (
                <Text style={styles.body} numberOfLines={3}>
                  {item.message}
                </Text>
              ) : null}
              {open ? (
                <View style={styles.actions}>
                  <Button
                    label="View partner"
                    variant="secondary"
                    onPress={() => router.push({ pathname: "/service/[id]", params: { id: item.directoryProfileId } })}
                    style={styles.flex}
                  />
                  <Button
                    label="Cancel"
                    variant="tertiary"
                    loading={cancel.isPending && cancel.variables === item.id}
                    onPress={() => confirmCancel(item)}
                    style={styles.flex}
                  />
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing["4xl"], gap: spacing.md, flexGrow: 1 },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  firm: { ...type.emphasis, color: colors.ink, flex: 1 },
  meta: { ...type.caption, color: colors.inkMuted },
  body: { ...type.body, color: colors.inkSecondary },
  actions: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
});
