import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import {
  Button,
  DateTimeField,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  StatusBadge,
  TextField,
  toast,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Calendar, Lock, Mail, Phone } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { applyBookingAction, getServiceBooking, type BookingAction, type ProviderBooking } from "@/lib/api/services/provider";
import { bookingStatusMeta, formatBookingWhen, formatInr, shortBookingId } from "@/lib/booking-status";
import { userFacingError } from "@/lib/errors";
import { colors, radius, spacing, type } from "@/theme/tokens";

function tomorrowAt11() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(11, 0, 0, 0);
  return date;
}

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn, profile } = useApp();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [proposed, setProposed] = useState(tomorrowAt11);
  const [showPropose, setShowPropose] = useState(false);

  const query = useQuery({
    queryKey: ["service-booking", id],
    queryFn: () => getServiceBooking(id),
    enabled: isLoggedIn && Boolean(id),
  });

  const action = useMutation({
    mutationFn: (input: { action: BookingAction; when?: string | null }) =>
      applyBookingAction(id, input.action, note.trim() || null, input.when),
    onSuccess: (booking) => {
      queryClient.setQueryData(["service-booking", id], booking);
      void queryClient.invalidateQueries({ queryKey: ["service-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["provider-metrics"] });
      setNote("");
      setShowPropose(false);
      toast(`Booking ${bookingStatusMeta(booking.status).label.toLowerCase()}`);
    },
    onError: (error) => appAlert("Couldn't update booking", userFacingError(error, "Try again.")),
  });

  if (!isLoggedIn) {
    return (
      <Screen title="Booking" fallbackHref="/(tabs)/services">
        <EmptyState
          icon={Lock}
          title="Sign in required"
          message="Sign in to see this booking."
          actionLabel="Sign in"
          onAction={() => router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)}
        />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen title="Booking" fallbackHref={"/services/dashboard" as Href}>
        <ListSkeleton rows={5} />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen title="Booking" fallbackHref={"/services/dashboard" as Href}>
        <ErrorState onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const booking = query.data;
  if (!booking) {
    return (
      <Screen title="Booking" fallbackHref={"/services/dashboard" as Href}>
        <EmptyState icon={Calendar} title="Booking not available" message="This request is not on your account." />
      </Screen>
    );
  }

  const isProvider = profile?.id === booking.providerUserId;
  const meta = bookingStatusMeta(booking.status);
  const run = (name: BookingAction, when?: string | null) => action.mutate({ action: name, when });
  const busy = action.isPending;

  return (
    <Screen
      title={`Booking ${shortBookingId(booking.id)}`}
      subtitle={booking.serviceName || "Service visit"}
      fallbackHref={(isProvider ? "/services/bookings" : "/my-service-bookings") as Href}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      <View style={styles.top}>
        <StatusBadge label={meta.label} tone={meta.tone} />
        <Text style={styles.meta}>Created {formatBookingWhen(booking.createdAt)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>{isProvider ? booking.customerName || "Customer" : booking.firmName || "Service partner"}</Text>
        {isProvider ? (
          <>
            <Text style={styles.body}>{[booking.customerEmail, booking.customerPhone].filter(Boolean).join(" · ") || "No profile contact on file"}</Text>
            <Button label={booking.contactPhone} icon={Phone} variant="tertiary" onPress={() => void Linking.openURL(`tel:${booking.contactPhone.replace(/\s/g, "")}`)} />
            {booking.customerEmail ? (
              <Button label="Email customer" icon={Mail} variant="tertiary" onPress={() => void Linking.openURL(`mailto:${booking.customerEmail}`)} />
            ) : null}
          </>
        ) : (
          <Text style={styles.body}>{[booking.category, booking.city].filter(Boolean).join(" · ")}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Fact label="Requested service" value={booking.serviceName || "Visit"} />
        <Fact label="Preferred time" value={formatBookingWhen(booking.preferredAt)} />
        {booking.proposedAt ? <Fact label="Proposed time" value={formatBookingWhen(booking.proposedAt)} /> : null}
        <Fact label="Location" value={booking.locationAddress || "Not provided"} />
        <Fact label="Notes" value={booking.message || "None"} />
        <Fact label="Amount" value={formatInr(booking.amountInr == null ? null : Number(booking.amountInr))} />
        <Fact label="Payment" value={paymentLabel(booking.paymentStatus)} />
        {booking.respondedAt ? <Fact label="Last response" value={formatBookingWhen(booking.respondedAt)} /> : null}
        {booking.rejectionReason ? <Fact label="Rejection reason" value={booking.rejectionReason} /> : null}
        {booking.cancellationReason ? <Fact label="Cancellation reason" value={booking.cancellationReason} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Activity</Text>
        {(booking.events ?? []).length === 0 ? (
          <Text style={styles.body}>No responses recorded yet.</Text>
        ) : (
          booking.events?.map((event) => (
            <View key={event.id} style={styles.event}>
              <Text style={styles.emphasis}>{eventLabel(event.kind, event.toStatus)}</Text>
              <Text style={styles.meta}>{formatBookingWhen(event.createdAt)}</Text>
              {event.note ? <Text style={styles.body}>{event.note}</Text> : null}
              {event.proposedAt ? <Text style={styles.body}>Proposed {formatBookingWhen(event.proposedAt)}</Text> : null}
            </View>
          ))
        )}
      </View>

      <TextField label="Note for this response" multiline value={note} onChangeText={setNote} placeholder="Optional reason or instruction" />
      {showPropose ? <DateTimeField label="Proposed time" value={proposed} onChange={setProposed} /> : null}

      <View style={styles.actions}>
        {isProvider ? providerActions(booking, busy, showPropose, setShowPropose, proposed, run) : customerActions(booking, busy, run)}
      </View>
    </Screen>
  );
}

function providerActions(
  booking: ProviderBooking,
  busy: boolean,
  showPropose: boolean,
  setShowPropose: (value: boolean) => void,
  proposed: Date,
  run: (name: BookingAction, when?: string | null) => void,
) {
  const status = booking.status;
  if (status === "pending" || status === "reschedule_requested") {
    return (
      <>
        <Button label="Accept" loading={busy} onPress={() => run("accept")} />
        <Button label="Reject" variant="secondary" disabled={busy} onPress={() => run("reject")} />
        <Button label={showPropose ? "Send new time" : "Propose another time"} variant="tertiary" disabled={busy} onPress={() => (showPropose ? run("propose_reschedule", proposed.toISOString()) : setShowPropose(true))} />
      </>
    );
  }
  if (status === "confirmed") {
    return (
      <>
        <Button label="Start service" loading={busy} onPress={() => run("start")} />
        <Button label="Mark completed" variant="secondary" disabled={busy} onPress={() => run("complete")} />
        <Button label="Cancel booking" variant="tertiary" disabled={busy} onPress={() => run("cancel")} />
        <Button label={showPropose ? "Send new time" : "Propose another time"} variant="tertiary" disabled={busy} onPress={() => (showPropose ? run("propose_reschedule", proposed.toISOString()) : setShowPropose(true))} />
      </>
    );
  }
  if (status === "in_progress") {
    return (
      <>
        <Button label="Mark completed" loading={busy} onPress={() => run("complete")} />
        <Button label="Cancel booking" variant="secondary" disabled={busy} onPress={() => run("cancel")} />
      </>
    );
  }
  if (status === "reschedule_proposed") {
    return <Button label="Cancel booking" variant="secondary" disabled={busy} onPress={() => run("cancel")} />;
  }
  return null;
}

function customerActions(booking: ProviderBooking, busy: boolean, run: (name: BookingAction, when?: string | null) => void) {
  if (booking.status === "reschedule_proposed") {
    return (
      <>
        <Button label="Accept proposed time" loading={busy} onPress={() => run("accept_reschedule")} />
        <Button label="Ask for another time" variant="secondary" disabled={busy} onPress={() => run("decline_reschedule")} />
        <Button label="Cancel booking" variant="tertiary" disabled={busy} onPress={() => run("cancel")} />
      </>
    );
  }
  if (booking.status === "pending" || booking.status === "confirmed" || booking.status === "reschedule_requested" || booking.status === "in_progress") {
    return (
      <>
        {booking.status === "pending" || booking.status === "confirmed" ? (
          <Button label="Request a new time" variant="secondary" disabled={busy} onPress={() => run("request_reschedule")} />
        ) : null}
        <Button label="Cancel booking" variant="tertiary" disabled={busy} onPress={() => run("cancel")} />
      </>
    );
  }
  return null;
}

function paymentLabel(status: ProviderBooking["paymentStatus"]): string {
  if (status === "paid") return "Paid";
  if (status === "unpaid") return "Unpaid — collection is outside the app";
  return "Not collected in the app";
}

function eventLabel(kind: string, toStatus?: string | null): string {
  if (kind === "requested") return "Request received";
  if (toStatus) return bookingStatusMeta(toStatus).label;
  return kind.replace(/_/g, " ");
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={styles.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: { ...type.heading, color: colors.ink },
  emphasis: { ...type.emphasis, color: colors.ink },
  body: { ...type.body, color: colors.inkSecondary },
  meta: { ...type.caption, color: colors.inkMuted },
  event: { gap: spacing.xxs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  fact: { gap: spacing.xxs },
  actions: { gap: spacing.sm },
});
