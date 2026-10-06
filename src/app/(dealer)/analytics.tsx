import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BarChart,
  DonutChart,
  ErrorState,
  ListRow,
  ListSection,
  ListSkeleton,
  Screen,
  StatCard,
  StatGrid,
} from "@/components/ds";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3, Building2, Calendar, MessageSquare, Wallet } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { formatIndianPrice } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function DealerAnalyticsScreen() {
  const router = useRouter();
  const { fetchDealerAnalytics } = useApp();
  const query = useQuery({ queryKey: ["dealer", "analytics"], queryFn: fetchDealerAnalytics });
  const data = query.data;

  const statusData = data
    ? [
        { label: "Active", value: data.listingsActive, color: colors.success },
        { label: "In review", value: data.listingsPending, color: colors.gold },
        { label: "Draft", value: data.listingsDraft, color: colors.inkMuted },
        { label: "Not approved", value: data.listingsRejected, color: colors.danger },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <Screen
      title="Analytics"
      root
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      contentStyle={{ gap: spacing.lg }}
    >
      {query.isPending ? (
        <ListSkeleton rows={4} />
      ) : !data ? (
        <ErrorState message="Check your connection and try again." onRetry={() => void query.refetch()} />
      ) : data.listingsTotal === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          message="Once you add listings, their views, inquiries and visits show up here."
          actionLabel="Add a listing"
          onAction={() => router.push("/post-property")}
        />
      ) : (
        <>
          <StatGrid>
            <StatCard
              label="Active listings"
              value={data.listingsActive}
              icon={Building2}
              hint={`${data.listingsTotal} total`}
              onPress={() => router.push("/(dealer)/properties")}
            />
            <StatCard
              label="Inquiries"
              value={data.inquiriesTotal}
              icon={MessageSquare}
              onPress={() => router.push("/(dealer)/inquiries")}
            />
            <StatCard
              label="Site visits"
              value={data.visitsTotal}
              icon={Calendar}
              hint={data.visitsPending > 0 ? `${data.visitsPending} to confirm` : `${data.visitsConfirmed} confirmed`}
              onPress={() => router.push("/manage-visits")}
            />
            <StatCard label="Inventory value" value={formatIndianPrice(data.inventoryValueSum)} icon={Wallet} />
          </StatGrid>

          {statusData.length > 0 ? (
            <Panel title="Listings by status">
              <DonutChart data={statusData} centerLabel="listings" />
            </Panel>
          ) : null}

          {data.monthlyInquiries.length > 0 ? (
            <Panel title="Inquiries per month">
              <BarChart data={data.monthlyInquiries.map((m) => ({ label: m.month, value: m.count }))} />
            </Panel>
          ) : null}

          {data.cityBreakdown.length > 1 ? (
            <Panel title="Listings by city">
              <BarChart data={data.cityBreakdown.map((c) => ({ label: c.city, value: c.count }))} />
            </Panel>
          ) : null}

          {data.topListings.length > 0 ? (
            <ListSection title="Most inquired">
              {data.topListings.map((row) => (
                <ListRow
                  key={row.id}
                  title={row.title}
                  subtitle={`${row.city} · ${row.status}`}
                  value={`${row.inquiryCount}`}
                  onPress={() => router.push({ pathname: "/property/[id]", params: { id: row.id } })}
                />
              ))}
            </ListSection>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.lg,
    gap: spacing.lg,
    boxShadow: shadow.card,
  },
  panelTitle: { ...type.emphasis, color: colors.ink },
});
