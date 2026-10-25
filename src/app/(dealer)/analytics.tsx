import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BarChart,
  ChipGroup,
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

type StatusFilter = "All" | "Active" | "Pending Review" | "Draft" | "Rejected" | "Sold" | "Rented";

const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Active",
  "Pending Review",
  "Draft",
  "Rejected",
  "Sold",
  "Rented",
];

export default function DealerAnalyticsScreen() {
  const router = useRouter();
  const { fetchDealerAnalytics } = useApp();
  const query = useQuery({ queryKey: ["dealer", "analytics"], queryFn: fetchDealerAnalytics });
  const data = query.data;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const typeOptions = useMemo(() => {
    const types = new Set((data?.listings ?? []).map((l) => l.type).filter(Boolean));
    return ["All", ...Array.from(types).sort()];
  }, [data?.listings]);

  const filteredListings = useMemo(() => {
    const rows = data?.listings ?? [];
    return rows.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (typeFilter !== "All" && l.type !== typeFilter) return false;
      return true;
    });
  }, [data?.listings, statusFilter, typeFilter]);

  const filtersActive = statusFilter !== "All" || typeFilter !== "All";

  const filteredKpis = useMemo(() => {
    if (!data) return null;
    if (!filtersActive) {
      return {
        listings: data.listingsTotal,
        active: data.listingsActive,
        inquiries: data.inquiriesTotal,
        visits: data.visitsTotal,
        value: data.inventoryValueSum,
      };
    }
    return {
      listings: filteredListings.length,
      active: filteredListings.filter((l) => l.status === "Active").length,
      inquiries: filteredListings.reduce((sum, l) => sum + (l.inquiryCount || 0), 0),
      visits: null as number | null, // visits are not per-listing on the API
      value: filteredListings.reduce((sum, l) => sum + (l.price || 0), 0),
    };
  }, [data, filteredListings, filtersActive]);

  const statusData = useMemo(() => {
    if (!data) return [];
    const source = filtersActive ? filteredListings : data.listings;
    const counts = {
      Active: 0,
      "Pending Review": 0,
      Draft: 0,
      Rejected: 0,
    };
    for (const l of source) {
      if (l.status in counts) counts[l.status as keyof typeof counts] += 1;
    }
    return [
      { label: "Active", value: counts.Active, color: colors.success },
      { label: "In review", value: counts["Pending Review"], color: colors.gold },
      { label: "Draft", value: counts.Draft, color: colors.inkMuted },
      { label: "Not approved", value: counts.Rejected, color: colors.danger },
    ].filter((d) => d.value > 0);
  }, [data, filteredListings, filtersActive]);

  const cityBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filteredListings) {
      map.set(l.city, (map.get(l.city) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredListings]);

  const topListings = useMemo(
    () =>
      [...filteredListings]
        .sort((a, b) => b.inquiryCount - a.inquiryCount)
        .slice(0, 5),
    [filteredListings],
  );

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
      ) : query.isError || !data ? (
        <ErrorState
          message="Couldn't load analytics. Check your connection and try again."
          onRetry={() => void query.refetch()}
        />
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
          <ChipGroup
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
            labelFor={(s) => (s === "All" ? "All statuses" : s)}
          />
          {typeOptions.length > 1 ? (
            <ChipGroup options={typeOptions} value={typeFilter} onChange={setTypeFilter} labelFor={(t) => (t === "All" ? "All types" : t)} />
          ) : null}

          {filteredKpis ? (
            <StatGrid>
              <StatCard
                label="Your listings"
                value={filteredKpis.listings}
                icon={Building2}
                hint={`${filteredKpis.active} live`}
                onPress={() => router.push("/(dealer)/properties")}
              />
              <StatCard
                label="Active live"
                value={filteredKpis.active}
                icon={Building2}
                onPress={() => router.push("/(dealer)/properties")}
              />
              <StatCard
                label="Inquiries"
                value={filteredKpis.inquiries}
                icon={MessageSquare}
                onPress={() => router.push("/(dealer)/inquiries")}
              />
              <StatCard
                label="Site visits"
                value={filteredKpis.visits ?? "—"}
                icon={Calendar}
                hint={
                  filtersActive
                    ? "Not filterable by listing"
                    : data.visitsPending > 0
                      ? `${data.visitsPending} to confirm`
                      : `${data.visitsConfirmed} confirmed`
                }
                onPress={() => router.push("/manage-visits")}
              />
              <StatCard label="Inventory value" value={formatIndianPrice(filteredKpis.value)} icon={Wallet} />
            </StatGrid>
          ) : null}

          {statusData.length > 0 ? (
            <Panel title="Listings by status">
              <DonutChart data={statusData} centerLabel="listings" />
            </Panel>
          ) : null}

          {!filtersActive && data.monthlyInquiries.length > 0 ? (
            <Panel title="Inquiries per month">
              <BarChart data={data.monthlyInquiries.map((m) => ({ label: m.month, value: m.count }))} />
            </Panel>
          ) : null}

          {cityBreakdown.length > 1 ? (
            <Panel title="Listings by city">
              <BarChart data={cityBreakdown.map((c) => ({ label: c.city, value: c.count }))} />
            </Panel>
          ) : null}

          {topListings.length > 0 ? (
            <ListSection title="Most inquired">
              {topListings.map((row) => (
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
