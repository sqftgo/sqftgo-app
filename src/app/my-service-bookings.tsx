import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { Button, EmptyState, ErrorState, ListSkeleton, Screen, StatusBadge, toast } from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Briefcase, Lock } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { isApiMode } from "@/lib/api/config";
import { applyBookingAction, listServiceBookings, type ProviderBooking } from "@/lib/api/services/provider";
import { mobileAuthConfigured } from "@/lib/api/supabase";
import { apiCancelServiceBooking, apiListMyServiceBookings } from "@/lib/api/services/services";
import { bookingStatusMeta, formatBookingWhen } from "@/lib/booking-status";
import { userFacingError } from "@/lib/errors";
import { colors, radius, spacing, type } from "@/theme/tokens";

const KEY = ["service-bookings", "mine"];

export default function MyServiceBookingsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useApp();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<ProviderBooking[]> => {
      if (mobileAuthConfigured) return listServiceBookings("customer");
      const rows = await apiListMyServiceBookings();
      return rows.map((row) => ({ ...row, message: row.message ?? null }));
    },
    enabled: (isApiMode || mobileAuthConfigured) && isLoggedIn,
  });

  const respond = useMutation({
    mutationFn: async (input: { id: string; action: "cancel" | "accept_reschedule" | "decline_reschedule" | "request_reschedule" }) => {
      if (mobileAuthConfigured) return applyBookingAction(input.id, input.action);
      const updated = await apiCancelServiceBooking(input.id);
      return { ...updated, message: updated.message ?? null };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ProviderBooking[]>(KEY, (prev) => prev?.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
      toast(bookingStatusMeta(updated.status).label);
    },
    onError: (e) => appAlert("Couldn't update booking", userFacingError(e, "Try again.")),
  });

  if (!isLoggedIn) {
    return (
      <Screen title="Service bookings" fallbackHref="/(tabs)/services">
        <EmptyState
          icon={Lock}
          title="Sign in required"
          message="Sign in to see the booking requests you sent to partners."
          actionLabel="Sign in"
          onAction={() =>
            router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)
          }
        />
      </Screen>
    );
  }

  const confirmCancel = (item: ProviderBooking) =>
    appAlert("Cancel this request?", `${item.firmName ?? "The partner"} will be told you no longer need the visit.`, [
      { text: "Keep", style: "cancel" },
      { text: "Cancel request", style: "destructive", onPress: () => respond.mutate({ id: item.id, action: "cancel" }) },
    ]);

  const connected = isApiMode || mobileAuthConfigured;
  const empty = !connected ? (
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
        onRefresh={connected ? () => void query.refetch() : undefined}
        contentContainerStyle={styles.list}
        ListEmptyComponent={empty}
        renderItem={({ item }) => {
          const meta = bookingStatusMeta(item.status);
          const open = item.status === "pending" || item.status === "confirmed" || item.status === "reschedule_requested" || item.status === "reschedule_proposed" || item.status === "in_progress";
          const pendingThis = respond.isPending && respond.variables?.id === item.id;
          return (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.firm} numberOfLines={1}>
                  {item.firmName || "Service partner"}
                </Text>
                <StatusBadge label={meta.label} tone={meta.tone} />
              </View>
              <Text style={styles.meta}>{[item.city, item.serviceName, formatBookingWhen(item.preferredAt)].filter(Boolean).join(" · ")}</Text>
              {item.proposedAt ? <Text style={styles.body}>Proposed time: {formatBookingWhen(item.proposedAt)}</Text> : null}
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
                  {mobileAuthConfigured ? (
                    <Button
                      label="Details"
                      variant="secondary"
                      onPress={() => router.push({ pathname: "/services/booking/[id]", params: { id: item.id } } as unknown as Href)}
                      style={styles.flex}
                    />
                  ) : null}
                  {item.status === "reschedule_proposed" && mobileAuthConfigured ? (
                    <Button label="Accept time" loading={pendingThis} onPress={() => respond.mutate({ id: item.id, action: "accept_reschedule" })} style={styles.flex} />
                  ) : null}
                  <Button label="Cancel" variant="tertiary" loading={pendingThis} onPress={() => confirmCancel(item)} style={styles.flex} />
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
