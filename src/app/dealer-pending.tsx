import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, FileCheck, LayoutDashboard, Shield } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { KYC_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

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

  if (canAccessDealerDashboard) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
        <Text style={{ ...type.title, color: colors.ink }}>Dealer access approved</Text>
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.sm }}>
          Your role is broker. Open the dashboard to manage listings and leads.
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/dashboard" as Href)}
          style={{
            marginTop: spacing.xl,
            height: 48,
            backgroundColor: colors.accent,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...type.emphasis, color: colors.onAccent }}>Go to dashboard</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const kycStatus = profile?.kyc?.status;
  const steps = [
    {
      Icon: FileCheck,
      title: "Directory card",
      detail:
        dealerAccess === "pending" || dealerAccess === "approved"
          ? "Submitted — visible in public directory"
          : "Not submitted yet",
      done: dealerAccess === "pending" || dealerAccess === "approved",
    },
    {
      Icon: Shield,
      title: "KYC (optional)",
      detail: kycStatus
        ? KYC_STATUS_LABEL[kycStatus]
        : "You can submit documents while waiting",
      done: kycStatus === "pending" || kycStatus === "approved",
    },
    {
      Icon: LayoutDashboard,
      title: "Broker role",
      detail:
        userRole === "broker"
          ? "Approved — full dealer tools unlocked"
          : "Waiting for web admin promotion (not available in-app)",
      done: userRole === "broker",
    },
  ];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.xl, gap: spacing.lg, flex: 1 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: "rgba(255, 184, 0, 0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Clock size={28} color="#B45309" />
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...type.title, color: colors.ink }}>Pending dealer access</Text>
          <Text style={{ ...type.body, color: colors.inkMuted }}>
            A directory card alone is not enough. Until web admin sets your profile role to{" "}
            <Text style={{ fontWeight: "700", color: colors.ink }}>broker</Text>, the dealer
            dashboard stays locked. You can keep browsing as a buyer.
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {steps.map((step) => (
            <View
              key={step.title}
              style={{
                flexDirection: "row",
                gap: spacing.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                boxShadow: shadow.card,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.md,
                  backgroundColor: step.done ? colors.successSoft : colors.surfaceSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <step.Icon size={18} color={step.done ? colors.success : colors.inkMuted} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...type.emphasis, color: colors.ink }}>{step.title}</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/dealer-kyc" as Href)}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ ...type.emphasis, color: colors.ink }}>
            {kycStatus ? "View KYC status" : "Submit KYC"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)/index" as Href)}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
            boxShadow: shadow.accent,
          })}
        >
          <Text style={{ ...type.emphasis, color: colors.onAccent }}>Continue as buyer</Text>
        </Pressable>

        {/* Local demo only — stands in for web admin role promotion */}
        {!isApiMode && dealerAccess === "pending" ? (
          <Pressable
            onPress={() => {
              simulateDealerApproval();
              router.replace("/(tabs)/dashboard" as Href);
            }}
            style={{ alignItems: "center", paddingVertical: spacing.sm }}
          >
            <Text style={{ ...type.caption, color: colors.inkMuted, textAlign: "center" }}>
              Demo: simulate web admin approval → broker
            </Text>
          </Pressable>
        ) : null}
        {isApiMode && dealerAccess === "pending" ? (
          <Pressable
            onPress={() => {
              void refreshSessionFromApi();
            }}
            style={{ alignItems: "center", paddingVertical: spacing.sm }}
          >
            <Text style={{ ...type.caption, color: colors.inkMuted, textAlign: "center" }}>
              Refresh status after web admin approval
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
