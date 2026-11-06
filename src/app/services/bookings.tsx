import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useProviderBlock } from "@/components/provider-block";
import {
  Button,
  Chip,
  DateField,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  StatusBadge,
  TextField,
} from "@/components/ds";
import { Calendar } from "@/components/ui/icons";
import { listServiceBookings, type ProviderBooking } from "@/lib/api/services/provider";
import type { ServiceBookingStatus } from "@/lib/api/services/services";
import { bookingStatusMeta, formatBookingWhen, shortBookingId } from "@/lib/booking-status";
import { colors, radius, spacing, type } from "@/theme/tokens";

const PAGE = 8;

const STATUS_FILTERS: { value: ServiceBookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
  { value: "reschedule_requested", label: "Reschedule asked" },
  { value: "reschedule_proposed", label: "Time proposed" },
];

function matchesView(booking: ProviderBooking, view: string): boolean {
  if (view === "requests") {
    return booking.status === "pending" || booking.status === "reschedule_requested" || booking.status === "reschedule_proposed";
  }
  if (view === "responses") return booking.status === "pending" || booking.status === "reschedule_requested";
  if (view === "confirmed" || view === "completed" || view === "cancelled" || view === "rejected" || view === "in_progress") {
    return booking.status === view;
  }
  return true;
}

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const view = typeof params.view === "string" ? params.view : "all";
  const blocked = useProviderBlock("Bookings");
  const query = useQuery({
    queryKey: ["service-bookings", "provider"],
    queryFn: () => listServiceBookings("provider"),
    enabled: blocked == null,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServiceBookingStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data ?? []).filter((booking) => {
      if (!matchesView(booking, view)) return false;
      if (status !== "all" && booking.status !== status) return false;
      const day = booking.preferredAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (!q) return true;
      const haystack = [
        booking.id,
        booking.customerName,
        booking.customerEmail,
        booking.customerPhone,
        booking.contactPhone,
        booking.serviceName,
        booking.locationAddress,
        booking.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query.data, view, status, from, to, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const title = view === "responses" ? "Booking responses" : view === "requests" ? "Booking requests" : "All bookings";

  if (blocked) return blocked;

  return (
    <Screen
      title={title}
      subtitle={`${filtered.length} from your account`}
      fallbackHref={"/services/dashboard" as Href}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      <TextField label="Search" value={search} onChangeText={(value) => { setSearch(value); setPage(0); }} placeholder="Name, phone, service or booking ID" />
      <DateField label="From" value={from} onChange={(value) => { setFrom(value); setPage(0); }} />
      <DateField label="To" value={to} onChange={(value) => { setTo(value); setPage(0); }} />
      <View style={styles.chips}>
        {STATUS_FILTERS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={status === item.value}
            onPress={() => {
              setStatus(item.value);
              setPage(0);
            }}
          />
        ))}
      </View>

      {query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Calendar} title="No bookings in this view" message="New requests from customers appear here with their contact details." />
      ) : (
        <View style={styles.list}>
          {visible.map((booking) => {
            const meta = bookingStatusMeta(booking.status);
            return (
              <View key={booking.id} style={styles.card}>
                <View style={styles.top}>
                  <Text style={styles.name}>{booking.customerName || "Customer"}</Text>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </View>
                <Text style={styles.meta}>#{shortBookingId(booking.id)} · {booking.serviceName || "Service visit"}</Text>
                <Text style={styles.meta}>{formatBookingWhen(booking.preferredAt)}</Text>
                <Text style={styles.meta}>{booking.contactPhone}</Text>
                <Button
                  label="View details"
                  variant="secondary"
                  onPress={() => router.push({ pathname: "/services/booking/[id]", params: { id: booking.id } } as unknown as Href)}
                />
              </View>
            );
          })}
          {pages > 1 ? (
            <View style={styles.pager}>
              <Button label="Previous" variant="secondary" disabled={safePage === 0} onPress={() => setPage(safePage - 1)} style={styles.flex} />
              <Text style={styles.meta}>{safePage + 1} / {pages}</Text>
              <Button label="Next" variant="secondary" disabled={safePage >= pages - 1} onPress={() => setPage(safePage + 1)} style={styles.flex} />
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  list: { gap: spacing.md },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  name: { ...type.emphasis, color: colors.ink, flex: 1 },
  meta: { ...type.caption, color: colors.inkMuted },
  pager: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
});
