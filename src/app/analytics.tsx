import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart3, ChevronLeft } from "lucide-react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { DealerAnalytics } from "@/data/types";
import { formatIndianPrice } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function AnalyticsScreen() {
  const router = useRouter();
  const { canAccessDealerDashboard, fetchDealerAnalytics, dealerAccess } = useApp();
  const [data, setData] = useState<DealerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canAccessDealerDashboard) {
      setLoading(false);
      return;
    }
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
  }, [canAccessDealerDashboard, fetchDealerAnalytics]);

  if (!canAccessDealerDashboard) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={BarChart3}
          title="Dealer access required"
          message={
            dealerAccess === "pending"
              ? "Analytics unlock after broker role approval."
              : "Register as a dealer first."
          }
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={{ ...type.heading, color: colors.ink }}>Analytics</Text>
      </View>

      {loading || !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
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
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  boxShadow: shadow.card,
                }}
              >
                <Text style={{ ...type.heading, color: colors.ink }}>{kpi.value}</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
            }}
          >
            <Text style={{ ...type.label, color: colors.inkMuted }}>INVENTORY VALUE</Text>
            <Text style={{ ...type.title, color: colors.ink, marginTop: spacing.xs }}>
              {formatIndianPrice(data.inventoryValueSum)}
            </Text>
          </View>

          {data.cityBreakdown.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.lg,
                gap: spacing.sm,
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

          {data.monthlyInquiries.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.lg,
                gap: spacing.sm,
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

          {data.topListings.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.lg,
                gap: spacing.sm,
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
