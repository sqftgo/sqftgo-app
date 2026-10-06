import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, ListRow, ListSection, Screen, toast } from "@/components/ds";
import { CheckCircle2, Clock, FileCheck, LayoutDashboard, Shield } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { KYC_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function DealerPendingScreen() {
  const router = useRouter();
  const {
    dealerAccess,
    userRole,
    profile,
    simulateDealerApproval,
    canAccessDealerDashboard,
    isApiMode,
    refreshSessionFromApi,
  } = useApp();
  const [checking, setChecking] = useState(false);

  if (canAccessDealerDashboard) {
    return (
      <Screen title="Dealer access" fallbackHref={"/" as Href}>
        <View style={[styles.hero, { backgroundColor: colors.successSoft }]}>
          <CheckCircle2 size={28} color={colors.success} />
          <Text style={styles.title}>You&apos;re approved</Text>
          <Text style={styles.body}>Your dealer tools are ready. Manage listings, leads and visits from the dashboard.</Text>
        </View>
        <Button label="Go to dashboard" onPress={() => router.replace("/(dealer)" as Href)} fullWidth />
      </Screen>
    );
  }

  const kycStatus = profile?.kyc?.status;
  const cardDone = dealerAccess === "pending" || dealerAccess === "approved";

  const checkStatus = async () => {
    setChecking(true);
    await refreshSessionFromApi();
    setChecking(false);
    toast("Status updated");
  };

  return (
    <Screen title="Dealer access" fallbackHref={"/" as Href}>
      <View style={styles.hero}>
        <Clock size={28} color={colors.warning} />
        <Text style={styles.title}>Your application is in review</Text>
        <Text style={styles.body}>
          The SqftGo team checks every dealer before unlocking the dashboard. Until then you can browse, save homes and
          contact sellers as usual.
        </Text>
      </View>

      <ListSection title="Your progress">
        <ListRow
          icon={FileCheck}
          iconTint={cardDone ? colors.success : undefined}
          title="Business details"
          subtitle={cardDone ? "Submitted" : "Not submitted yet"}
          onPress={cardDone ? undefined : () => router.push("/dealer-register" as Href)}
        />
        <ListRow
          icon={Shield}
          iconTint={kycStatus === "approved" ? colors.success : undefined}
          title="Identity documents (KYC)"
          subtitle={kycStatus ? KYC_STATUS_LABEL[kycStatus] : "Optional, but speeds up review"}
          onPress={() => router.push("/dealer-kyc" as Href)}
        />
        <ListRow
          icon={LayoutDashboard}
          iconTint={userRole === "broker" ? colors.success : undefined}
          title="Team approval"
          subtitle={userRole === "broker" ? "Approved" : "Waiting for the SqftGo team"}
        />
      </ListSection>

      <View style={{ gap: spacing.sm }}>
        {isApiMode && dealerAccess === "pending" ? (
          <Button label="Check status" variant="secondary" onPress={() => void checkStatus()} loading={checking} fullWidth />
        ) : null}
        <Button label="Continue browsing" variant="tertiary" onPress={() => router.replace("/(tabs)" as Href)} fullWidth />
        {!isApiMode && dealerAccess === "pending" ? (
          <Button
            label="Approve this device (offline preview)"
            variant="tertiary"
            size="sm"
            onPress={() => {
              simulateDealerApproval();
              router.replace("/(dealer)" as Href);
            }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { ...type.heading, color: colors.ink },
  body: { ...type.body, color: colors.inkSecondary },
});
