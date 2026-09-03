import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreditCard, Sparkles } from "@/components/ui/icons";

import { appAlert } from "@/components/ui/app-alert";
import {
  RazorpayCheckoutModal,
  type RazorpayCheckoutSuccess,
} from "@/components/ui/razorpay-checkout-modal";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import { formatPlanPrice, PARTNER_PLANS, type PartnerPlanId } from "@/constants/partner-plans";
import { isApiMode } from "@/lib/api/config";
import {
  apiCreateSubscriptionOrder,
  apiGetSubscriptionOverview,
  apiVerifySubscriptionPayment,
  type SubscriptionOrder,
  type SubscriptionOverview,
} from "@/lib/api/services/billing";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function DealerSubscriptionScreen() {
  const { userName, userEmail, canAccessDealerDashboard } = useApp();
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<PartnerPlanId | null>(null);
  const [checkout, setCheckout] = useState<SubscriptionOrder | null>(null);

  const load = useCallback(async () => {
    if (!isApiMode || !canAccessDealerDashboard) {
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setOverview(await apiGetSubscriptionOverview());
    } catch (e) {
      appAlert("Could not load billing", e instanceof Error ? e.message : "Try again.");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [canAccessDealerDashboard]);

  useEffect(() => {
    void load();
  }, [load]);

  const activePlanId =
    overview?.subscription?.status === "active" ? overview.subscription.planId : null;

  const startCheckout = async (planId: PartnerPlanId) => {
    if (!isApiMode) {
      appAlert("API required", "Set EXPO_PUBLIC_API_URL to enable billing.");
      return;
    }
    if (!overview?.billingEnabled) {
      appAlert(
        "Billing offline",
        "Razorpay keys are not configured on the server yet.",
      );
      return;
    }
    setBusyPlan(planId);
    try {
      const order = await apiCreateSubscriptionOrder(planId);
      if (!order.keyId) throw new Error("Razorpay key missing from server");
      setCheckout(order);
    } catch (e) {
      setBusyPlan(null);
      appAlert("Checkout failed", e instanceof Error ? e.message : "Try again.");
    }
  };

  const onCheckoutSuccess = async (response: RazorpayCheckoutSuccess) => {
    setCheckout(null);
    try {
      await apiVerifySubscriptionPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      appAlert("Payment verified", "Your partner plan is now active.");
      await load();
    } catch (e) {
      appAlert(
        "Verification issue",
        e instanceof Error
          ? e.message
          : "Payment received but verification failed. Refresh in a moment.",
      );
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenNavbar eyebrow="Dealer portal" title="Subscription" subtitle="Partner plans & billing" />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing["3xl"],
            gap: spacing.md,
          }}
        >
          <View
            style={{
              backgroundColor: colors.accentSoft,
              borderRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <CreditCard size={20} color={colors.accent} />
            <Text style={{ ...type.emphasis, color: colors.ink }}>
              {overview?.subscription?.status === "active"
                ? `Active · ${overview.subscription.planId}`
                : "No active paid plan"}
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>
              {overview?.subscription?.status === "active"
                ? `Renews / ends ${formatDate(overview.subscription.currentPeriodEnd)}`
                : overview?.billingEnabled
                  ? "Choose a plan below. Checkout opens Razorpay securely in-app."
                  : "Billing is disabled until Razorpay is configured on the BFF."}
            </Text>
          </View>

          {PARTNER_PLANS.map((plan) => {
            const isActive = activePlanId === plan.id;
            const busy = busyPlan === plan.id;
            return (
              <View
                key={plan.id}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: plan.highlighted ? 2 : 1,
                  borderColor: plan.highlighted ? colors.accent : colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  gap: spacing.sm,
                  boxShadow: shadow.card,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ ...type.heading, color: colors.ink }}>{plan.name}</Text>
                  {plan.badge ? (
                    <View style={{ backgroundColor: colors.accentSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                      <Text style={{ ...type.micro, fontWeight: "800", color: colors.accent }}>{plan.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ ...type.emphasis, color: colors.accent }}>
                  {formatPlanPrice(plan.amountPaise)}
                  <Text style={{ ...type.caption, color: colors.inkMuted }}> {plan.periodLabel}</Text>
                </Text>
                <Text style={{ ...type.body, color: colors.inkSecondary }}>{plan.tagline}</Text>
                {plan.features.map((f) => (
                  <Text key={f} style={{ ...type.caption, color: colors.inkMuted }}>
                    · {f}
                  </Text>
                ))}
                <Pressable
                  disabled={isActive || busy || !overview?.billingEnabled}
                  onPress={() => startCheckout(plan.id)}
                  style={{
                    marginTop: spacing.sm,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: isActive ? colors.surfaceSubtle : colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: !overview?.billingEnabled && !isActive ? 0.55 : 1,
                  }}
                >
                  <Text
                    style={{
                      ...type.label,
                      color: isActive ? colors.inkMuted : colors.onAccent,
                    }}
                  >
                    {isActive ? "Current plan" : busy ? "Opening…" : "Subscribe"}
                  </Text>
                </Pressable>
              </View>
            );
          })}

          {overview?.recentPayments?.length ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Sparkles size={16} color={colors.inkMuted} />
                <Text style={{ ...type.label, color: colors.inkMuted }}>RECENT PAYMENTS</Text>
              </View>
              {overview.recentPayments.slice(0, 5).map((p) => (
                <View
                  key={p.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                  }}
                >
                  <Text style={{ ...type.emphasis, color: colors.ink }}>
                    {p.planId} · {formatPlanPrice(p.amountPaise)}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>
                    {p.status} · {formatDate(p.paidAt ?? p.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      {checkout ? (
        <RazorpayCheckoutModal
          visible
          keyId={checkout.keyId}
          orderId={checkout.orderId}
          amount={checkout.amount}
          currency={checkout.currency}
          description={`${checkout.plan.name} partner plan`}
          prefillName={userName}
          prefillEmail={userEmail}
          onSuccess={onCheckoutSuccess}
          onDismiss={() => {
            setCheckout(null);
            setBusyPlan(null);
          }}
          onError={(message) => {
            setCheckout(null);
            setBusyPlan(null);
            appAlert("Payment failed", message);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
