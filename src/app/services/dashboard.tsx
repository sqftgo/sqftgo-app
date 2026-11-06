import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React from "react";
import { View } from "react-native";

import { useProviderBlock } from "@/components/provider-block";
import { ErrorState, ListRow, ListSection, ListSkeleton, Screen, StatCard, StatGrid } from "@/components/ds";
import { Bell, Briefcase, Calendar, Settings, Store, User, Users } from "@/components/ui/icons";
import { providerBookingMetrics } from "@/lib/api/services/provider";
import { formatInr } from "@/lib/booking-status";
import { spacing } from "@/theme/tokens";

export default function ServiceDashboardScreen() {
  const router = useRouter();
  const blocked = useProviderBlock("Service dashboard");
  const metrics = useQuery({
    queryKey: ["provider-metrics"],
    queryFn: providerBookingMetrics,
    enabled: blocked == null,
  });

  if (blocked) return blocked;
  if (metrics.isLoading) {
    return (
      <Screen title="Service dashboard" fallbackHref="/(tabs)/services">
        <ListSkeleton rows={6} />
      </Screen>
    );
  }
  if (metrics.isError || !metrics.data) {
    return (
      <Screen title="Service dashboard" fallbackHref="/(tabs)/services">
        <ErrorState onRetry={() => void metrics.refetch()} />
      </Screen>
    );
  }

  const data = metrics.data;
  const open = (href: string) => router.push(href as Href);

  return (
    <Screen
      title="Service dashboard"
      subtitle="Bookings, customers and availability"
      fallbackHref="/(tabs)/services"
      refreshing={metrics.isRefetching}
      onRefresh={() => void metrics.refetch()}
    >
      <StatGrid>
        <StatCard label="Total bookings" value={data.total} onPress={() => open("/services/bookings?view=all")} />
        <StatCard label="Pending" value={data.pending} onPress={() => open("/services/bookings?view=requests")} />
        <StatCard label="Confirmed" value={data.confirmed} onPress={() => open("/services/bookings?view=confirmed")} />
        <StatCard label="Completed" value={data.completed} onPress={() => open("/services/bookings?view=completed")} />
        <StatCard label="Cancelled" value={data.cancelled} onPress={() => open("/services/bookings?view=cancelled")} />
        <StatCard label="Rejected" value={data.rejected} onPress={() => open("/services/bookings?view=rejected")} />
        <StatCard label="Customers" value={data.customers} onPress={() => open("/services/customers")} />
        <StatCard
          label="Completed value"
          value={formatInr(Number(data.completedValue))}
          hint="Quoted on completed visits. Payments are not collected in the app."
        />
        <StatCard label="Upcoming" value={data.upcoming} onPress={() => open("/services/availability")} />
        <StatCard label="In progress" value={data.inProgress} onPress={() => open("/services/bookings?view=in_progress")} />
      </StatGrid>

      <View style={{ height: spacing.md }} />
      <ListSection title="Manage">
        <ListRow icon={Calendar} title="Booking requests" subtitle="Pending and reschedule replies" onPress={() => open("/services/bookings?view=requests")} />
        <ListRow icon={Briefcase} title="All bookings" subtitle="Search, filter and open every request" onPress={() => open("/services/bookings?view=all")} />
        <ListRow icon={Bell} title="Booking responses" subtitle="Requests waiting on you" onPress={() => open("/services/bookings?view=responses")} />
        <ListRow icon={Calendar} title="Calendar and availability" subtitle="Hours, blocked dates and confirmed visits" onPress={() => open("/services/availability")} />
        <ListRow icon={Store} title="My services" subtitle="Names, prices and duration" onPress={() => open("/services/catalog")} />
        <ListRow icon={Users} title="Customers" subtitle="People who have requested a booking" onPress={() => open("/services/customers")} />
        <ListRow icon={Bell} title="Notifications" subtitle="Booking updates sent to this account" onPress={() => open("/services/notifications")} />
        <ListRow icon={User} title="Business profile" subtitle="Name, contact, location and verification" onPress={() => open("/services/manage")} />
        <ListRow icon={Settings} title="Settings" subtitle="Account and business preferences" onPress={() => open("/services/settings")} />
      </ListSection>
    </Screen>
  );
}
