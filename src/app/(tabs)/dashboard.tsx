import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Plus,
} from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { formatPriceWithPeriod } from "@/lib/format";
import {
  ownedPropertyIds,
  ownsInquiry,
  ownsProperty,
  ownsVisit,
} from "@/lib/ownership";
import { PROPERTY_STATUS_LABEL, VISIT_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const STATUS_TONE: Record<Property["status"], { bg: string; color: string }> = {
  Draft: { bg: colors.surfaceSubtle, color: colors.inkMuted },
  "Pending Review": { bg: "rgba(255, 184, 0, 0.12)", color: "#B45309" },
  Active: { bg: colors.successSoft, color: colors.success },
  Sold: { bg: colors.infoSoft, color: colors.info },
  Rented: { bg: colors.infoSoft, color: colors.info },
  Rejected: { bg: colors.dangerSoft, color: colors.danger },
};

export default function DashboardScreen() {
  const router = useRouter();
  const {
    properties,
    inquiries,
    visits,
    userEmail,
    userName,
    profile,
    canAccessDealerDashboard,
    dealerAccess,
    updateVisitStatus,
  } = useApp();

  const ownerOpts = useMemo(
    () => ({ userId: profile?.id, email: userEmail }),
    [profile?.id, userEmail],
  );

  const mine = useMemo(
    () => properties.filter((p) => ownsProperty(p, ownerOpts)),
    [properties, ownerOpts],
  );

  const ownedIds = useMemo(() => ownedPropertyIds(properties, ownerOpts), [properties, ownerOpts]);

  const myInquiries = useMemo(
    () => inquiries.filter((i) => ownsInquiry(i, { email: userEmail, ownedPropertyIds: ownedIds })),
    [inquiries, userEmail, ownedIds],
  );

  const myVisits = useMemo(
    () => visits.filter((v) => ownsVisit(v, { email: userEmail, ownedPropertyIds: ownedIds })),
    [visits, userEmail, ownedIds],
  );

  const kpis = useMemo(
    () => ({
      active: mine.filter((p) => p.status === "Active").length,
      leads: myInquiries.length,
      visits: myVisits.length,
    }),
    [mine, myInquiries, myVisits],
  );

  const upcomingVisits = useMemo(
    () =>
      myVisits
        .filter((v) => v.status === "pending" || v.status === "confirmed")
        .slice(0, 4),
    [myVisits],
  );

  const latestInquiries = useMemo(() => myInquiries.slice(0, 4), [myInquiries]);
  const recentListings = useMemo(() => mine.slice(0, 5), [mine]);

  if (!canAccessDealerDashboard) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={ClipboardList}
          title="Pending dealer access"
          message={
            dealerAccess === "pending"
              ? "Your directory is submitted. Full dashboard unlocks after web admin sets role to broker."
              : "Register your dealer directory first. A card alone is not enough — you need broker role."
          }
          actionLabel={dealerAccess === "pending" ? "View status" : "Become a dealer"}
          onAction={() =>
            router.push(
              (dealerAccess === "pending" ? "/dealer-pending" : "/dealer-register") as Href,
            )
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing.xl }}>
          <ScreenNavbar
            eyebrow="Dealer portal"
            title={userName ? `Welcome, ${userName.split(" ")[0]}` : "Welcome"}
            subtitle="Listings go live after web admin approval"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
          }}
        >
          {[
            { label: "Active Listings", value: kpis.active, Icon: CheckCircle2 },
            { label: "New Leads", value: kpis.leads, Icon: Inbox },
            { label: "Site Visits", value: kpis.visits, Icon: Calendar },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                width: "30%",
                flexGrow: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                gap: spacing.xs,
                boxShadow: shadow.card,
              }}
            >
              <stat.Icon size={16} color={colors.accent} />
              <Text style={{ ...type.heading, color: colors.ink }}>{stat.value}</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
            marginTop: spacing.lg,
          }}
        >
          <Pressable
            onPress={() => router.push("/post-property")}
            style={({ pressed }) => ({
              flex: 1,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.85 : 1,
              boxShadow: shadow.accent,
            })}
          >
            <Plus size={18} color={colors.onAccent} />
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>List New Property</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/analytics" as Href)}
            style={({ pressed }) => ({
              height: 48,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <BarChart3 size={16} color={colors.ink} />
            <Text style={{ ...type.label, color: colors.ink }}>Analytics</Text>
          </Pressable>
        </View>

        <SectionHeader
          title="Recent listings"
          action="All"
          onAction={() => router.push("/(tabs)/properties" as Href)}
        />
        {recentListings.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Text style={{ ...type.caption, color: colors.inkMuted }}>No listings yet.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
          >
            {recentListings.map((item) => {
              const tone = STATUS_TONE[item.status];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/edit-property/${item.id}` as Href)}
                  style={{
                    width: 220,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    gap: spacing.xs,
                    boxShadow: shadow.card,
                  }}
                >
                  <Text style={{ ...type.emphasis, color: colors.ink }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>
                    {item.locality}, {item.city}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.ink }}>
                    {formatPriceWithPeriod(item.price, item.purpose)}
                  </Text>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: tone.bg,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                      borderRadius: radius.full,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ ...type.micro, color: tone.color, fontWeight: "700" }}>
                      {PROPERTY_STATUS_LABEL[item.status]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <SectionHeader
          title="Upcoming visits"
          action="Manage"
          onAction={() => router.push("/manage-visits" as Href)}
        />
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {upcomingVisits.length === 0 ? (
            <Text style={{ ...type.caption, color: colors.inkMuted }}>No upcoming visits.</Text>
          ) : (
            upcomingVisits.map((v) => (
              <View
                key={v.id}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  gap: spacing.xs,
                }}
              >
                <Text style={{ ...type.emphasis, color: colors.ink }} numberOfLines={1}>
                  {v.propertyTitle}
                </Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  {v.buyerName} · {v.visitDate} {v.visitTime} ·{" "}
                  {VISIT_STATUS_LABEL[v.status]}
                </Text>
                {v.status === "pending" ? (
                  <Pressable
                    onPress={() => updateVisitStatus(v.id, "confirmed")}
                    style={{
                      alignSelf: "flex-start",
                      marginTop: spacing.xs,
                      backgroundColor: colors.successSoft,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                    }}
                  >
                    <Text style={{ ...type.caption, color: colors.success, fontWeight: "700" }}>
                      Confirm
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        <SectionHeader
          title="Latest inquiries"
          action="Inbox"
          onAction={() => router.push("/(tabs)/inquiries" as Href)}
        />
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {latestInquiries.length === 0 ? (
            <Text style={{ ...type.caption, color: colors.inkMuted }}>No inquiries yet.</Text>
          ) : (
            latestInquiries.map((inq) => (
              <Pressable
                key={inq.id}
                onPress={() => router.push("/(tabs)/inquiries" as Href)}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  gap: 4,
                }}
              >
                <Text style={{ ...type.emphasis, color: colors.ink }} numberOfLines={1}>
                  {inq.propertyTitle}
                </Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={2}>
                  {inq.buyerName}: {inq.message}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ ...type.label, color: colors.inkMuted }}>{title.toUpperCase()}</Text>
      <Pressable onPress={onAction}>
        <Text style={{ ...type.caption, color: colors.accent, fontWeight: "700" }}>{action}</Text>
      </Pressable>
    </View>
  );
}
