import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { ListRow, ListSection } from "@/components/ds/ListRow";
import { Screen } from "@/components/ds/Screen";
import { StatusBadge } from "@/components/ds/StatusBadge";
import { appAlert } from "@/components/ui/app-alert";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Compass,
  CreditCard,
  Eye,
  FileText,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Store,
  Users,
} from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { useMyServiceProfile } from "@/hooks/use-my-service-profile";
import { initialsFromName } from "@/lib/format";
import { ownsDirectory } from "@/lib/ownership";
import { KYC_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function ProfileScreen() {
  const router = useRouter();
  const {
    isLoggedIn,
    canAccessDealerDashboard,
    signOut,
    userEmail,
    userName,
    profile,
    favorites,
    inquiries,
    visits,
    dealerAccess,
    userRole,
    directoryProfiles,
    platformSettings,
    myListingsCount,
  } = useApp();

  const go = (href: string) => router.push(href as Href);

  const confirmSignOut = () =>
    appAlert("Sign out?", "You can keep browsing as a guest.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);

  const myDirectory = useMemo(() => {
    if (!isLoggedIn) return undefined;
    if (profile?.directoryProfileId) {
      const byId = directoryProfiles.find((d) => d.id === profile.directoryProfileId);
      if (byId) return byId;
    }
    return directoryProfiles.find((d) => ownsDirectory(d, { userId: profile?.id, email: userEmail }));
  }, [directoryProfiles, isLoggedIn, profile, userEmail]);

  const { profile: serviceProfile } = useMyServiceProfile();
  const serviceRow = serviceProfile ? (
    <ListRow
      icon={Briefcase}
      title="Service business"
      subtitle={serviceProfile.firmName}
      onPress={() => go("/services/manage")}
    />
  ) : (
    <ListRow
      icon={Briefcase}
      title="List your service business"
      subtitle="Movers, interiors, legal and more"
      onPress={() => go("/services/register")}
    />
  );

  const email = userEmail.toLowerCase();
  const myInquiries = inquiries.filter((i) => i.buyerEmail.toLowerCase() === email).length;
  const myVisits = visits.filter((v) => v.buyerEmail.toLowerCase() === email).length;
  const openLeads = inquiries.filter(
    (i) => i.brokerEmail.toLowerCase() === email && (i.status === "new" || i.status === "read"),
  ).length;

  const supportSection = (
    <ListSection title="Support">
      <ListRow icon={HelpCircle} title="Help & support" onPress={() => go("/help")} />
      <ListRow icon={Shield} title="Privacy Policy" onPress={() => go("/legal/privacy")} />
      <ListRow icon={FileText} title="Terms of Service" onPress={() => go("/legal/terms")} />
    </ListSection>
  );

  const discoverSection = (
    <ListSection title="Discover">
      <ListRow icon={Building2} title="New projects" onPress={() => go("/projects")} />
      <ListRow icon={Compass} title="Destinations" onPress={() => go("/destinations")} />
      <ListRow icon={Users} title="Dealers & agents" onPress={() => go("/brokers")} />
    </ListSection>
  );

  if (!isLoggedIn) {
    return (
      <Screen title="Profile" root>
        <View style={styles.guestCard}>
          <View style={styles.guestIcon}>
            <Heart size={26} color={colors.accent} />
          </View>
          <Text style={styles.guestTitle}>Your home search, in one place</Text>
          <Text style={styles.guestBody}>
            Sign in to save homes, book site visits, message dealers and list your property.
          </Text>
          <View style={styles.guestActions}>
            <Button label="Sign in" onPress={() => router.push({ pathname: "/auth", params: { mode: "sign-in" } })} fullWidth />
            <Button
              label="Create account"
              variant="secondary"
              onPress={() => router.push({ pathname: "/auth", params: { mode: "sign-up" } })}
              fullWidth
            />
          </View>
        </View>
        {discoverSection}
        {supportSection}
      </Screen>
    );
  }

  const avatarUri = canAccessDealerDashboard ? (myDirectory?.avatarUrl ?? profile?.avatar) : profile?.avatar;
  const displayName = (canAccessDealerDashboard ? myDirectory?.ownerName : undefined) || userName || userEmail;

  const identity = (
    <Pressable
      onPress={() => go(canAccessDealerDashboard ? "/dealer-settings" : "/settings/profile")}
      accessibilityRole="button"
      accessibilityLabel="Edit profile"
      style={({ pressed }) => [styles.identity, pressed && { backgroundColor: colors.surfaceSubtle }]}
    >
      <View style={styles.avatar}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <Text style={styles.initials}>{initialsFromName(displayName)}</Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {canAccessDealerDashboard && myDirectory?.firmName ? (
          <Text style={styles.sub} numberOfLines={1}>
            {myDirectory.firmName}
          </Text>
        ) : null}
        <Text style={styles.sub} numberOfLines={1} selectable>
          {userEmail}
        </Text>
        <Text style={styles.editLink}>{canAccessDealerDashboard ? "Edit business profile" : "Edit profile"}</Text>
      </View>
    </Pressable>
  );

  if (canAccessDealerDashboard) {
    const kycStatus = profile?.kyc?.status;
    return (
      <Screen
        title="Profile"
        root
        actions={[{ icon: Settings, label: "Settings", onPress: () => go("/settings") }]}
      >
        {identity}

        {myDirectory?.id ? (
          <Button
            label="View public profile"
            icon={Eye}
            variant="secondary"
            onPress={() => router.push({ pathname: "/broker/[id]", params: { id: myDirectory.id } })}
            fullWidth
          />
        ) : null}

        <ListSection title="Business">
          <ListRow icon={Store} title="Business profile" subtitle="Firm, contact and specialties" onPress={() => go("/dealer-settings")} />
          <ListRow
            icon={Shield}
            title="KYC & RERA"
            accessory={kycStatus ? <StatusBadge label={KYC_STATUS_LABEL[kycStatus]} /> : undefined}
            subtitle={kycStatus ? undefined : "Not submitted"}
            onPress={() => go("/dealer-kyc")}
          />
          <ListRow icon={CreditCard} title="Plans & billing" onPress={() => go("/subscription")} />
        </ListSection>

        <ListSection title="Manage">
          <ListRow icon={Plus} title="Add property" onPress={() => go("/post-property")} />
          <ListRow icon={Building2} title="My projects" onPress={() => go("/dealer-projects")} />
          <ListRow icon={Calendar} title="Site visits" onPress={() => go("/manage-visits")} />
          <ListRow
            icon={MessageSquare}
            title="Inbox"
            value={openLeads > 0 ? String(openLeads) : undefined}
            onPress={() => go("/(dealer)/inquiries")}
          />
          <ListRow icon={BarChart3} title="Analytics" onPress={() => go("/(dealer)/analytics")} />
          {serviceRow}
        </ListSection>

        {supportSection}

        <ListSection>
          <ListRow icon={LogOut} title="Sign out" destructive showChevron={false} onPress={confirmSignOut} />
        </ListSection>
      </Screen>
    );
  }

  const stats = [
    { label: "Saved", value: favorites.length, href: "/(tabs)/saved" },
    { label: "Inquiries", value: myInquiries, href: "/my-inquiries" },
    { label: "Visits", value: myVisits, href: "/my-visits" },
  ];

  return (
    <Screen
      title="Profile"
      root
      actions={[{ icon: Settings, label: "Settings", onPress: () => go("/settings") }]}
    >
      {identity}

      <View style={styles.stats}>
        {stats.map((s, i) => (
          <Pressable
            key={s.label}
            onPress={() => go(s.href)}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}, ${s.value}`}
            style={({ pressed }) => [
              styles.stat,
              i > 0 && styles.statDivider,
              pressed && { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {dealerAccess === "pending" && userRole !== "broker" ? (
        <Pressable onPress={() => go("/dealer-pending")} style={styles.notice} accessibilityRole="button">
          <Clock size={18} color={colors.warning} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.noticeTitle}>Dealer application under review</Text>
            <Text style={styles.noticeBody}>You can keep using all customer features meanwhile.</Text>
          </View>
        </Pressable>
      ) : null}

      <ListSection title="Activity">
        <ListRow icon={Calendar} title="My visits" onPress={() => go("/my-visits")} />
        <ListRow icon={MessageSquare} title="My inquiries" onPress={() => go("/my-inquiries")} />
        <ListRow icon={Briefcase} title="Service bookings" onPress={() => go("/my-service-bookings")} />
        {platformSettings.allowUserListings ? (
          <ListRow
            icon={Home}
            title="My listings"
            value={`${myListingsCount}/${platformSettings.maxListingsPerUser}`}
            onPress={() => go("/my-listings")}
          />
        ) : null}
      </ListSection>

      {discoverSection}

      <ListSection title="Grow with SqftGo">
        {dealerAccess === "none" ? (
          <ListRow icon={Store} title="Become a dealer" subtitle="List more properties and get leads" onPress={() => go("/dealer-register")} />
        ) : dealerAccess === "pending" ? (
          <ListRow icon={Shield} title="Dealer KYC" onPress={() => go("/dealer-kyc")} />
        ) : null}
        {serviceRow}
      </ListSection>

      {supportSection}

      <ListSection>
        <ListRow icon={LogOut} title="Sign out" destructive showChevron={false} onPress={confirmSignOut} />
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guestCard: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: { ...type.title, color: colors.ink, textAlign: "center" },
  guestBody: { ...type.body, color: colors.inkMuted, textAlign: "center" },
  guestActions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: { ...type.title, color: colors.onPrimary },
  name: { ...type.heading, color: colors.ink },
  sub: { ...type.caption, color: colors.inkMuted },
  editLink: { ...type.caption, color: colors.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600", marginTop: 2 },
  stats: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: spacing.md + 2, gap: 2 },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
  statValue: { ...type.title, color: colors.ink, fontVariant: ["tabular-nums"] },
  statLabel: { ...type.caption, color: colors.inkMuted },
  notice: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    padding: spacing.lg,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  noticeTitle: { ...type.emphasis, color: colors.warning },
  noticeBody: { ...type.caption, color: colors.inkSecondary },
});
