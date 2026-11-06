import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useProviderBlock } from "@/components/provider-block";
import { Button, EmptyState, ErrorState, ListSkeleton, Screen, TextField } from "@/components/ds";
import { Users } from "@/components/ui/icons";
import { listServiceBookings } from "@/lib/api/services/provider";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function ProviderCustomersScreen() {
  const router = useRouter();
  const blocked = useProviderBlock("Customers");
  const query = useQuery({
    queryKey: ["service-bookings", "provider"],
    queryFn: () => listServiceBookings("provider"),
    enabled: blocked == null,
  });
  const [search, setSearch] = useState("");

  const customers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, { id: string; name: string; email: string; phone: string; bookings: number; latest: string }>();
    for (const booking of query.data ?? []) {
      const current = map.get(booking.userId) ?? {
        id: booking.userId,
        name: booking.customerName || "Customer",
        email: booking.customerEmail || "",
        phone: booking.customerPhone || booking.contactPhone,
        bookings: 0,
        latest: booking.id,
      };
      current.bookings += 1;
      current.latest = booking.id;
      map.set(booking.userId, current);
    }
    return [...map.values()].filter((customer) => {
      if (!q) return true;
      return `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(q);
    });
  }, [query.data, search]);

  if (blocked) return blocked;

  return (
    <Screen
      title="Customers"
      subtitle="Counted from booking records on this account"
      fallbackHref={"/services/dashboard" as Href}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      <TextField label="Search" value={search} onChangeText={setSearch} placeholder="Name, email or mobile" />
      {query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" message="A customer appears here after they send you a booking request." />
      ) : (
        customers.map((customer) => (
          <View key={customer.id} style={styles.card}>
            <Text style={styles.name}>{customer.name}</Text>
            <Text style={styles.meta}>{[customer.phone, customer.email].filter(Boolean).join(" · ")}</Text>
            <Text style={styles.meta}>{customer.bookings} booking{customer.bookings === 1 ? "" : "s"}</Text>
            <Button
              label="Latest booking"
              variant="secondary"
              onPress={() => router.push({ pathname: "/services/booking/[id]", params: { id: customer.latest } } as unknown as Href)}
            />
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { ...type.emphasis, color: colors.ink },
  meta: { ...type.caption, color: colors.inkMuted },
});
