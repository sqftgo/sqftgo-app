import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import type { DealerAnalytics } from "@/data/types";
import { formatIndianPrice } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function DealerAnalyticsScreen() {
  const router = useRouter();
  const { fetchDealerAnalytics } = useApp();
  const [data, setData] = useState<DealerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const analytics = await fetchDealerAnalytics();
      if (!cancelled) {
        setData(analytics);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchDealerAnalytics]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenNavbar
          eyebrow="Dealer portal"
          title="Analytics"
          subtitle="Performance overview for your listings"
        />
      </View>

      {loading || !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md }}>
          {/* KPI Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {[
              { label: "Listings", value: data.listingsTotal },
              { label: "Active", value: data.listingsActive },
              { label: "Pending", value: data.listingsPending },
              { label: "Draft", value: data.listingsDraft },
              { label: "Inquiries", value: data.inquiriesTotal },
              { label: "Visits", value: data.visitsTotal },
              { label: "Visits pending", value: data.visitsPending },
              { label: "Visits confirmed", value: data.visitsConfirmed },
            ].map((kpi) => (
              <View
                key={kpi.label}
                style={{
                  width: "47%",
                  flexGrow: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  padding: spacing.md,
                  boxShadow: shadow.card,
                }}
              >
                <Text style={{ ...type.heading, color: colors.ink }}>{kpi.value}</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          {/* Inventory Value */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              padding: spacing.lg,
              boxShadow: shadow.card,
            }}
          >
            <Text style={{ ...type.label, color: colors.inkMuted }}>INVENTORY VALUE</Text>
            <Text style={{ ...type.title, color: colors.ink, marginTop: spacing.xs }}>
              {formatIndianPrice(data.inventoryValueSum)}
            </Text>
          </View>

          {/* City Breakdown */}
          {data.cityBreakdown.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.lg,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.label, color: colors.inkMuted }}>BY CITY</Text>
              {data.cityBreakdown.map((row) => (
                <View
                  key={row.city}
                  style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                  <Text style={{ ...type.body, color: colors.ink }}>{row.city}</Text>
                  <Text style={{ ...type.emphasis, color: colors.ink }}>{row.count}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Monthly Inquiries */}
          {data.monthlyInquiries.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.lg,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.label, color: colors.inkMuted }}>MONTHLY INQUIRIES</Text>
              {data.monthlyInquiries.map((row) => (
                <View
                  key={row.month}
                  style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                  <Text style={{ ...type.body, color: colors.ink }}>{row.month}</Text>
                  <Text style={{ ...type.emphasis, color: colors.ink }}>{row.count}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Top Listings */}
          {data.topListings.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.lg,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.label, color: colors.inkMuted }}>TOP LISTINGS</Text>
              {data.topListings.map((row) => (
                <Pressable
                  key={row.id}
                  onPress={() => router.push(`/edit-property/${row.id}` as Href)}
                  style={{ paddingVertical: spacing.xs }}
                >
                  <Text style={{ ...type.emphasis, color: colors.ink }} numberOfLines={1}>
                    {row.title}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>
                    {row.city} · {row.status} · {row.inquiryCount} inquiries
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

