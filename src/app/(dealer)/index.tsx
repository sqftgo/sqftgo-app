import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ds/Button";
import { StatCard, StatGrid } from "@/components/ds/StatCard";
import { StatusBadge, toneForStatus } from "@/components/ds/StatusBadge";
import { toast } from "@/components/ds/Toast";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  MessageSquare,
  Plus,
  ShieldCheck,
  ViewGrid,
} from "@/components/ui/icons";
import { NotificationsSheet, useNotifications } from "@/components/ui/notifications-sheet";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { SectionHeader } from "@/components/ui/section-header";
import { useApp } from "@/context/AppContext";
import { formatPriceWithPeriod } from "@/lib/format";
import {
  ownedPropertyIds,
  ownsDirectory,
  ownsInquiry,
  ownsProperty,
  ownsVisit,
} from "@/lib/ownership";
import { PROPERTY_STATUS_LABEL, VISIT_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function Panel({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <View style={styles.panelTitles}>
          <Text style={styles.panelTitle}>{title}</Text>
          {description ? <Text style={styles.panelDesc}>{description}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
            <Text style={styles.panelAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: typeof Plus;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.quickAction, pressed && { backgroundColor: colors.accentSoft }]}
    >
      <View style={styles.quickIcon}>
        <Icon size={18} color={colors.accent} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

export default function DealerDashboardScreen() {
  const router = useRouter();
  const {
    properties,
    inquiries,
    visits,
    userEmail,
    userName,
    profile,
    directoryProfiles,
    updateVisitStatus,
    refreshMyProperties,
    refreshVisits,
    refreshInquiries,
  } = useApp();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const ownerOpts = useMemo(
    () => ({ userId: profile?.id, email: userEmail }),
    [profile?.id, userEmail],
  );

  const myDirectory = useMemo(() => {
    if (profile?.directoryProfileId) {
      const byId = directoryProfiles.find((d) => d.id === profile.directoryProfileId);
      if (byId) return byId;
    }
    return directoryProfiles.find((d) => ownsDirectory(d, ownerOpts));
  }, [directoryProfiles, profile?.directoryProfileId, ownerOpts]);

  const mine = useMemo(
    () => properties.filter((p) => ownsProperty(p, ownerOpts)),
    [properties, ownerOpts],
  );

  const ownedIds = useMemo(
    () => ownedPropertyIds(properties, ownerOpts),
    [properties, ownerOpts],
  );

  const myInquiries = useMemo(
    () =>
      inquiries
        .filter((i) => ownsInquiry(i, { email: userEmail, ownedPropertyIds: ownedIds }))
        .slice()
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [inquiries, userEmail, ownedIds],
  );

  const myVisits = useMemo(
    () => visits.filter((v) => ownsVisit(v, { email: userEmail, ownedPropertyIds: ownedIds })),
    [visits, userEmail, ownedIds],
  );

  const activeCount = useMemo(
    () => mine.filter((p) => p.status === "Active").length,
    [mine],
  );
  const rejectedCount = useMemo(
    () => mine.filter((p) => p.status === "Rejected").length,
    [mine],
  );
  const newLeadCount = useMemo(
    () => myInquiries.filter((i) => !i.status || i.status === "new").length,
    [myInquiries],
  );
  const pendingVisitCount = useMemo(
    () => myVisits.filter((v) => v.status === "pending").length,
    [myVisits],
  );

  const upcomingVisits = useMemo(
    () =>
      myVisits
        .filter((v) => v.status === "pending" || v.status === "confirmed")
        .slice(0, 5),
    [myVisits],
  );

  const recentListings = useMemo(() => mine.slice(0, 4), [mine]);
  const latestInquiries = useMemo(() => myInquiries.slice(0, 4), [myInquiries]);

  const firstName =
    myDirectory?.ownerName?.split(" ")[0] ||
    userName?.split(" ")[0] ||
    "Dealer";

  const kyc = profile?.kyc;
  const showKycCard = !kyc || kyc.status === "draft" || kyc.status === "rejected";

  const attentionItems = useMemo(() => {
    const items: { label: string; value: number; href: Href }[] = [];
    if (newLeadCount > 0) {
      items.push({ label: "New leads", value: newLeadCount, href: "/(dealer)/inquiries" as Href });
    }
    if (pendingVisitCount > 0) {
      items.push({ label: "Visits to confirm", value: pendingVisitCount, href: "/manage-visits" as Href });
    }
    if (rejectedCount > 0) {
      items.push({
        label: "Rejected listings",
        value: rejectedCount,
        href: "/(dealer)/properties" as Href,
      });
    }
    return items;
  }, [newLeadCount, pendingVisitCount, rejectedCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshMyProperties(), refreshVisits(), refreshInquiries()]);
    } finally {
      setRefreshing(false);
    }
  };

  const confirmTour = async (visitId: string) => {
    const result = await updateVisitStatus(visitId, "confirmed");
    if (!result.ok) {
      appAlert("Couldn't confirm visit", result.message ?? "Please try again.");
      return;
    }
    toast("Tour confirmed");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <View style={styles.pad}>
          <ScreenNavbar
            eyebrow="Dealer portal"
            title={`Welcome back, ${firstName}`}
            subtitle="Summary of your listings and buyer activity"
            actions={[
              {
                icon: Bell,
                label: "Notifications",
                badge: unreadCount > 0,
                onPress: () => setNotificationsVisible(true),
              },
            ]}
          />
        </View>

        <View style={styles.pad}>
          <Button
            label="List New Property"
            icon={Plus}
            onPress={() => router.push("/post-property")}
            fullWidth
          />
        </View>

        {/* KPIs — same three metrics as web */}
        <View style={styles.pad}>
          <StatGrid>
            <StatCard
              label="Active Listings"
              value={activeCount}
              icon={Building2}
              onPress={() => router.push("/(dealer)/properties" as Href)}
            />
            <StatCard
              label="New Leads"
              value={newLeadCount}
              icon={MessageSquare}
              hint={`${myInquiries.length} total`}
              onPress={() => router.push("/(dealer)/inquiries" as Href)}
            />
            <StatCard
              label="Site Visits"
              value={myVisits.length}
              icon={Calendar}
              hint={pendingVisitCount > 0 ? `${pendingVisitCount} to confirm` : undefined}
              onPress={() => router.push("/manage-visits" as Href)}
            />
          </StatGrid>
        </View>

        {showKycCard ? (
          <View style={styles.pad}>
            <Pressable
              onPress={() => router.push("/dealer-kyc" as Href)}
              style={({ pressed }) => [styles.kycCard, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.kycIcon}>
                <ShieldCheck size={20} color={colors.warning} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.kycTitle}>
                  {kyc?.status === "rejected" ? "KYC needs attention" : "Complete KYC verification"}
                </Text>
                <Text style={styles.kycBody}>
                  {kyc?.status === "rejected"
                    ? kyc.rejectionReason || "Your documents were rejected. Resubmit to get verified."
                    : "Add PAN and Aadhaar so buyers can trust your listings."}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {attentionItems.length > 0 ? (
          <View style={styles.pad}>
            <Panel title="Needs attention">
              <View style={styles.attentionList}>
                {attentionItems.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => router.push(item.href)}
                    style={({ pressed }) => [styles.attentionRow, pressed && { backgroundColor: colors.surfaceSubtle }]}
                  >
                    <Text style={styles.attentionLabel}>{item.label}</Text>
                    <View style={styles.attentionBadge}>
                      <Text style={styles.attentionValue}>{item.value}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Panel>
          </View>
        ) : null}

        {/* Quick Actions — web parity */}
        <View style={styles.pad}>
          <Panel title="Quick Actions">
            <View style={styles.quickGrid}>
              <QuickAction
                label="Add Property"
                icon={Plus}
                onPress={() => router.push("/post-property")}
              />
              <QuickAction
                label="Check Leads"
                icon={MessageSquare}
                onPress={() => router.push("/(dealer)/inquiries" as Href)}
              />
              <QuickAction
                label="My Projects"
                icon={ViewGrid}
                onPress={() => router.push("/dealer-projects" as Href)}
              />
              <QuickAction
                label="Analytics"
                icon={BarChart3}
                onPress={() => router.push("/(dealer)/analytics" as Href)}
              />
            </View>
          </Panel>
        </View>

        {/* Analytics Summary — web parity */}
        <View style={styles.pad}>
          <Panel
            title="Analytics Summary"
            description="Your listing performance"
            actionLabel="Full report"
            onAction={() => router.push("/(dealer)/analytics" as Href)}
          >
            <View style={styles.summaryRows}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Active listings</Text>
                <Text style={styles.summaryValue}>{activeCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total inquiries</Text>
                <Text style={styles.summaryValue}>{myInquiries.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Site visits</Text>
                <Text style={styles.summaryValue}>{myVisits.length}</Text>
              </View>
              <Text style={styles.summaryNote}>Property view tracking is not available yet.</Text>
            </View>
          </Panel>
        </View>

        {/* Recent listings — vertical list with thumbnails like web */}
        <View style={styles.sectionBlock}>
          <View style={styles.pad}>
            <SectionHeader
              title="My Recent Listings"
              actionLabel="View all"
              onAction={() => router.push("/(dealer)/properties" as Href)}
            />
          </View>
          {recentListings.length === 0 ? (
            <View style={styles.pad}>
              <EmptyState
                compact
                icon={Building2}
                title="No listings yet"
                message="Publish your first property to start receiving buyer leads."
                actionLabel="Add property"
                onAction={() => router.push("/post-property")}
              />
            </View>
          ) : (
            <View style={[styles.pad, styles.listingStack]}>
              {recentListings.map((item) => {
                const thumb = item.images?.[0];
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/edit-property/${item.id}` as Href)}
                    style={({ pressed }) => [styles.listingRow, pressed && { backgroundColor: colors.surfaceSubtle }]}
                  >
                    <View style={styles.thumb}>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.thumbImg} contentFit="cover" />
                      ) : (
                        <Building2 size={22} color={colors.inkMuted} />
                      )}
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.listingMeta} numberOfLines={1}>
                        {item.locality}, {item.city}
                      </Text>
                    </View>
                    <View style={styles.listingRight}>
                      <Text style={styles.listingPrice} numberOfLines={1}>
                        {formatPriceWithPeriod(item.price, item.purpose)}
                      </Text>
                      <StatusBadge
                        label={PROPERTY_STATUS_LABEL[item.status]}
                        tone={toneForStatus(item.status)}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Upcoming visits — web “Upcoming Property Visits” */}
        <View style={styles.pad}>
          <Panel
            title="Upcoming Property Visits"
            actionLabel="Manage"
            onAction={() => router.push("/manage-visits" as Href)}
          >
            {upcomingVisits.length === 0 ? (
              <Text style={styles.emptyInline}>No upcoming tours yet.</Text>
            ) : (
              <View style={styles.visitStack}>
                {upcomingVisits.map((v) => (
                  <View key={v.id} style={styles.visitCard}>
                    <Calendar size={16} color={colors.accent} />
                    <View style={styles.flex}>
                      <View style={styles.visitTop}>
                        <Text style={styles.visitName} numberOfLines={1}>
                          {v.buyerName}
                        </Text>
                        <StatusBadge
                          label={VISIT_STATUS_LABEL[v.status]}
                          tone={toneForStatus(v.status)}
                        />
                      </View>
                      <Text style={styles.visitMeta}>
                        {v.visitDate} at {v.visitTime}
                      </Text>
                      <Text style={styles.visitProperty} numberOfLines={1}>
                        Re: {v.propertyTitle}
                      </Text>
                      {v.status === "pending" ? (
                        <Pressable
                          onPress={() => void confirmTour(v.id)}
                          hitSlop={6}
                          style={styles.confirmBtn}
                        >
                          <Text style={styles.confirmText}>Confirm Tour</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Panel>
        </View>

        {/* Latest Messages — web inquiries strip */}
        <View style={styles.sectionBlock}>
          <View style={styles.pad}>
            <SectionHeader
              title="Latest Messages"
              actionLabel="View all"
              onAction={() => router.push("/(dealer)/inquiries" as Href)}
            />
          </View>
          {latestInquiries.length === 0 ? (
            <View style={styles.pad}>
              <Text style={styles.emptyInline}>No inquiries yet.</Text>
            </View>
          ) : (
            <View style={[styles.pad, styles.listingStack]}>
              {latestInquiries.map((inq) => (
                <Pressable
                  key={inq.id}
                  onPress={() => router.push("/(dealer)/inquiries" as Href)}
                  style={({ pressed }) => [styles.messageRow, pressed && { backgroundColor: colors.surfaceSubtle }]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(inq.buyerName || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.visitTop}>
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {inq.buyerName}
                      </Text>
                      {inq.createdAt ? (
                        <Text style={styles.messageDate}>
                          {inq.createdAt.slice(0, 10)}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.visitProperty} numberOfLines={1}>
                      Re: {inq.propertyTitle}
                    </Text>
                    <Text style={styles.messageBody} numberOfLines={2}>
                      “{inq.message}”
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <NotificationsSheet
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing["3xl"], gap: spacing.lg },
  pad: { paddingHorizontal: spacing.xl },
  flex: { flex: 1, minWidth: 0 },
  sectionBlock: { gap: spacing.sm },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    boxShadow: shadow.card,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  panelTitles: { flex: 1, gap: 2 },
  panelTitle: { ...type.heading, color: colors.ink },
  panelDesc: { ...type.caption, color: colors.inkMuted },
  panelAction: { ...type.label, color: colors.accent },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickAction: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { ...type.caption, color: colors.ink, fontWeight: "600", textAlign: "center" },

  summaryRows: { gap: spacing.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { ...type.body, color: colors.inkMuted },
  summaryValue: { ...type.emphasis, color: colors.accent },
  summaryNote: { ...type.caption, color: colors.inkMuted, marginTop: spacing.xs },

  listingStack: { gap: spacing.sm },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImg: { width: "100%", height: "100%" },
  listingTitle: { ...type.emphasis, color: colors.ink },
  listingMeta: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
  listingRight: { alignItems: "flex-end", gap: spacing.xs, maxWidth: 110 },
  listingPrice: { ...type.caption, color: colors.accent, fontWeight: "700" },

  visitStack: { gap: spacing.sm },
  visitCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visitTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  visitName: { ...type.emphasis, color: colors.ink, flex: 1 },
  visitMeta: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
  visitProperty: {
    ...type.caption,
    color: colors.accent,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 4,
  },
  confirmBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.successSoft,
  },
  confirmText: { ...type.caption, color: colors.success, fontWeight: "700" },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...type.emphasis, color: colors.primary },
  messageDate: { ...type.caption, color: colors.inkMuted },
  messageBody: { ...type.body, color: colors.inkSecondary, marginTop: 4 },

  emptyInline: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },

  kycCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  kycIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  kycTitle: { ...type.emphasis, color: colors.ink },
  kycBody: { ...type.caption, color: colors.inkMuted, marginTop: 2 },

  attentionList: { gap: spacing.xs },
  attentionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  attentionLabel: { ...type.body, color: colors.ink },
  attentionBadge: {
    minWidth: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
  },
  attentionValue: { ...type.label, color: colors.accent },
});
