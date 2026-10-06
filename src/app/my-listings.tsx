import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { Screen } from "@/components/ds/Screen";
import { ListSkeleton } from "@/components/ds/Skeleton";
import { StatusBadge } from "@/components/ds/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Home, Lock, MessageSquare, Plus } from "@/components/ui/icons";
import { formatIndianCurrency } from "@/components/property/format";
import { useApp } from "@/context/AppContext";
import type { ListerStatus } from "@/data/types";
import { apiListReceivedInquiries } from "@/lib/api/services/inquiries";
import { apiListMyProperties } from "@/lib/api/services/properties";
import { ownsProperty } from "@/lib/ownership";
import { colors, radius, spacing, type } from "@/theme/tokens";

function listerLabel(status: ListerStatus | undefined): string {
  switch (status) {
    case "approved":
      return "Verified lister";
    case "pending":
      return "Pending admin review";
    case "rejected":
      return "Listing access declined";
    default:
      return "Not verified yet";
  }
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function MyListingsScreen() {
  const router = useRouter();
  const {
    isApiMode,
    isLoggedIn,
    userRole,
    properties,
    inquiries,
    profile,
    userEmail,
    platformSettings,
    mergeProperties,
  } = useApp();

  const mineQuery = useQuery({
    queryKey: ["properties", "mine"],
    queryFn: () => apiListMyProperties(50),
    enabled: isApiMode && isLoggedIn,
  });
  const leadsQuery = useQuery({
    queryKey: ["inquiries", "received"],
    queryFn: apiListReceivedInquiries,
    enabled: isApiMode && isLoggedIn,
  });

  useEffect(() => {
    if (mineQuery.data) mergeProperties(mineQuery.data);
  }, [mineQuery.data, mergeProperties]);

  const mine = useMemo(
    () =>
      mineQuery.data ??
      properties.filter((p) => ownsProperty(p, { userId: profile?.id, email: userEmail })),
    [mineQuery.data, properties, profile?.id, userEmail],
  );
  const titleById = useMemo(() => new Map(mine.map((p) => [p.id, p.title])), [mine]);

  const leads = useMemo(() => {
    if (leadsQuery.data) return leadsQuery.data.filter((l) => l.status !== "archived");
    const ids = new Set(mine.map((p) => p.id));
    return inquiries.filter((i) => ids.has(i.propertyId) && i.status !== "archived");
  }, [leadsQuery.data, inquiries, mine]);

  if (!isLoggedIn) {
    return (
      <Screen title="My listings">
        <EmptyState
          icon={Lock}
          title="Sign in required"
          message="Sign in to manage your listings and see buyer inquiries."
          actionLabel="Sign in"
          onAction={() => router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)}
        />
      </Screen>
    );
  }

  const maxSlots = platformSettings.maxListingsPerUser;
  const used = mine.filter((p) => p.status !== "Rejected").length;
  const remaining = Math.max(0, maxSlots - used);
  const listerStatus = profile?.listingStatus ?? "none";
  const canAdd =
    remaining > 0 && listerStatus !== "rejected" && userRole !== "broker" && platformSettings.allowUserListings;

  const addReason = !platformSettings.allowUserListings
    ? "New owner listings are paused right now."
    : listerStatus === "rejected"
      ? "Your listing access was declined. Contact support for help."
      : userRole === "broker"
        ? "Dealers add listings from the dealer dashboard."
        : remaining === 0
          ? `You've used all ${maxSlots} listing slots.`
          : null;

  const loading = isApiMode && mineQuery.isPending;

  return (
    <Screen
      title="My listings"
      refreshing={mineQuery.isRefetching || leadsQuery.isRefetching}
      onRefresh={
        isApiMode
          ? () => {
              void mineQuery.refetch();
              void leadsQuery.refetch();
            }
          : undefined
      }
      footer={
        canAdd ? (
          <Button label="List a property" icon={Plus} onPress={() => router.push("/post-property" as Href)} fullWidth />
        ) : undefined
      }
    >
      <View style={styles.summary}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{mine.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {remaining}/{maxSlots}
            </Text>
            <Text style={styles.statLabel}>Slots left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{isApiMode && leadsQuery.isPending ? "—" : leads.length}</Text>
            <Text style={styles.statLabel}>Inquiries</Text>
          </View>
        </View>
        <View style={styles.listerRow}>
          <StatusBadge
            label={listerLabel(listerStatus)}
            tone={listerStatus === "approved" ? "success" : listerStatus === "rejected" ? "danger" : listerStatus === "pending" ? "warning" : "neutral"}
          />
        </View>
        <Text style={styles.hint}>
          {addReason ??
            "Each listing stays private until an admin approves it. Add the nearest hospital, school and transport."}
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={styles.sectionTitle}>Your properties</Text>
        {loading ? (
          <ListSkeleton rows={2} />
        ) : mine.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            message="Add a home, plot or commercial space. Admin reviews it before buyers can see it."
          />
        ) : (
          mine.map((p) => (
            <Pressable
              key={p.id}
              onPress={() =>
                router.push(
                  p.status === "Active"
                    ? { pathname: "/property/[id]", params: { id: p.id } }
                    : { pathname: "/edit-property/[id]", params: { id: p.id } },
                )
              }
              accessibilityRole="button"
              accessibilityLabel={`${p.title}, ${p.status}`}
              style={({ pressed }) => [styles.listing, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.thumb}>
                {p.images[0] ? (
                  <Image source={{ uri: p.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Home size={22} color={colors.inkMuted} />
                )}
              </View>
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {p.title}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {p.locality}, {p.city}
                </Text>
                <Text style={styles.price}>{formatIndianCurrency(p.price)}</Text>
                {p.status === "Rejected" && p.rejectionReason ? (
                  <Text style={styles.reject} numberOfLines={3}>
                    {p.rejectionReason}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
                <StatusBadge label={p.status} />
                <Text style={styles.action}>{p.status === "Active" ? "View" : "Edit"}</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={styles.sectionTitle}>Inquiries on your listings</Text>
        {isApiMode && leadsQuery.isPending ? (
          <ListSkeleton rows={2} />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No buyer inquiries yet"
            message="When someone messages you about an Active listing, it shows up here."
          />
        ) : (
          leads.map((lead) => (
            <View key={lead.id} style={styles.lead}>
              <View style={styles.leadHead}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {lead.buyerName}
                </Text>
                <Text style={styles.meta}>{relativeDate(lead.createdAt)}</Text>
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                {titleById.get(lead.propertyId) ?? lead.propertyTitle ?? "Your listing"}
              </Text>
              <Text style={styles.body}>{lead.message}</Text>
              <View style={styles.leadActions}>
                {lead.buyerPhone ? (
                  <Button
                    label="Call"
                    variant="secondary"
                    onPress={() => void Linking.openURL(`tel:${lead.buyerPhone!.replace(/\s/g, "")}`)}
                  />
                ) : null}
                {lead.buyerEmail ? (
                  <Button
                    label="Email"
                    variant="secondary"
                    onPress={() =>
                      void Linking.openURL(
                        `mailto:${lead.buyerEmail}?subject=${encodeURIComponent(`Re: ${lead.propertyTitle || "your inquiry"}`)}`,
                      )
                    }
                  />
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stats: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center", gap: spacing.xxs },
  statValue: { ...type.heading, color: colors.ink, fontVariant: ["tabular-nums"] },
  statLabel: { ...type.caption, color: colors.inkMuted },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.border },
  listerRow: { flexDirection: "row" },
  hint: { ...type.caption, color: colors.inkMuted },
  sectionTitle: { ...type.heading, color: colors.ink },
  listing: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  listingTitle: { ...type.emphasis, color: colors.ink, flexShrink: 1 },
  meta: { ...type.caption, color: colors.inkMuted },
  price: { ...type.label, color: colors.accent },
  reject: { ...type.caption, color: colors.danger, marginTop: spacing.xxs },
  action: { ...type.label, color: colors.accent },
  lead: {
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
  },
  leadHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  body: { ...type.body, color: colors.inkSecondary },
  leadActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
});
