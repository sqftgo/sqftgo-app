import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Accordion,
  Button,
  ErrorState,
  ListRow,
  ListSection,
  ListSkeleton,
  Screen,
  StatusBadge,
  toast,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Check, CreditCard } from "@/components/ui/icons";
import { RazorpayCheckoutModal, type RazorpayCheckoutSuccess } from "@/components/ui/razorpay-checkout-modal";
import { formatPlanPrice, getPartnerPlan, PARTNER_PLANS, type PartnerPlanId } from "@/constants/partner-plans";
import { useApp } from "@/context/AppContext";
import { ListingPacksPanel } from "@/features/listing-packs/ListingPacksPanel";
import { isApiMode } from "@/lib/api/config";
import {
  apiCreateSubscriptionOrder,
  apiGetSubscriptionOverview,
  apiVerifySubscriptionPayment,
  type SubscriptionOrder,
} from "@/lib/api/services/billing";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const FAQS = [
  {
    key: "monthly",
    title: "Is this monthly or a one-time payment?",
    body: "It's a monthly subscription. Your plan renews every 30 days, and you can cancel any time before renewal.",
  },
  {
    key: "what",
    title: "What happens when I subscribe?",
    body: "Everything in the plan switches on as soon as your payment is verified.",
  },
  {
    key: "payment",
    title: "How do I pay?",
    body: "Payments go through Razorpay. You can use UPI, a credit or debit card, or net banking.",
  },
  {
    key: "packs",
    title: "Can I buy extra listing packs?",
    body: "Yes. When packs are offered, they add one-time listing slots on top of your plan.",
  },
  {
    key: "cancel",
    title: "How do I cancel?",
    body: "Email support@sqftgo.com before your next billing date. Your plan stays active until the current period ends.",
  },
];

const HISTORY_PREVIEW = 3;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function DealerSubscriptionScreen() {
  const { userName, userEmail, canAccessDealerDashboard } = useApp();
  const [busyPlan, setBusyPlan] = useState<PartnerPlanId | null>(null);
  const [checkout, setCheckout] = useState<SubscriptionOrder | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const query = useQuery({
    queryKey: ["dealer", "subscription"],
    queryFn: apiGetSubscriptionOverview,
    enabled: isApiMode && canAccessDealerDashboard,
  });
  const overview = query.data;

  if (!canAccessDealerDashboard || !isApiMode) {
    return (
      <Screen title="Plans & billing">
        <EmptyState
          icon={CreditCard}
          title={canAccessDealerDashboard ? "Needs a connection" : "For approved dealers"}
          message={
            canAccessDealerDashboard
              ? "Billing runs on SqftGo servers. Connect the app to manage your plan."
              : "Plans and listing packs are available once your dealer account is approved."
          }
        />
      </Screen>
    );
  }

  const sub = overview?.subscription;
  const active = sub?.status === "active";
  const activePlan = active ? getPartnerPlan(sub.planId) : undefined;
  const unlimited = Boolean(activePlan && activePlan.listingLimit == null);
  const payments = overview?.recentPayments ?? [];
  const visiblePayments = showAllHistory ? payments : payments.slice(0, HISTORY_PREVIEW);

  const startCheckout = async (planId: PartnerPlanId) => {
    if (!overview?.billingEnabled) {
      appAlert("Payments are paused", "Online payments aren't available right now. Please try again later.");
      return;
    }
    setBusyPlan(planId);
    try {
      const order = await apiCreateSubscriptionOrder(planId);
      if (!order.keyId) throw new Error("Payment setup is incomplete. Please try again later.");
      setCheckout(order);
    } catch (e) {
      setBusyPlan(null);
      appAlert("Couldn't start checkout", e instanceof Error ? e.message : "Please try again.");
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
      toast("Plan active");
      await query.refetch();
    } catch (e) {
      appAlert(
        "Payment received, verification pending",
        e instanceof Error ? e.message : "Pull to refresh in a moment to see your plan.",
      );
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <Screen
      title="Plans & billing"
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      contentStyle={{ gap: spacing.xl }}
    >
      {query.isPending ? (
        <ListSkeleton rows={3} />
      ) : query.isError ? (
        <ErrorState message="Check your connection and try again." onRetry={() => void query.refetch()} />
      ) : (
        <>
          <View style={[styles.status, active && styles.statusActive]}>
            <View style={styles.statusTop}>
              <Text style={styles.statusTitle}>{activePlan ? `${activePlan.name} plan` : "No active plan"}</Text>
              <StatusBadge label={active ? "Active" : "Inactive"} tone={active ? "success" : "neutral"} />
            </View>
            <Text style={styles.statusText}>
              {active
                ? `Renews on ${formatDate(sub?.currentPeriodEnd)}`
                : overview?.billingEnabled
                  ? "Subscribe to unlock unlimited listings and dealer tools."
                  : "Online payments are paused right now."}
            </Text>
          </View>

          {PARTNER_PLANS.map((plan) => {
            const isCurrent = activePlan?.id === plan.id;
            return (
              <View key={plan.id} style={[styles.plan, plan.highlighted && styles.planHighlighted]}>
                <View style={styles.statusTop}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.badge ? <StatusBadge label={plan.badge} tone="accent" /> : null}
                </View>
                <Text style={styles.planPrice}>
                  {formatPlanPrice(plan.amountPaise)}
                  <Text style={styles.planPeriod}> {plan.periodLabel}</Text>
                </Text>
                <Text style={styles.statusText}>{plan.tagline}</Text>
                <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                  {plan.features.map((f) => (
                    <View key={f} style={styles.feature}>
                      <Check size={16} color={colors.success} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  label={isCurrent ? "Current plan" : "Subscribe"}
                  onPress={() => void startCheckout(plan.id)}
                  loading={busyPlan === plan.id}
                  disabled={isCurrent || !overview?.billingEnabled}
                  variant={isCurrent ? "secondary" : "primary"}
                  fullWidth
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            );
          })}

          {unlimited ? null : <ListingPacksPanel canBuy={canAccessDealerDashboard} />}

          {payments.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <ListSection title="Payment history">
                {visiblePayments.map((p) => (
                  <ListRow
                    key={p.id}
                    title={`${getPartnerPlan(p.planId)?.name ?? "Plan"} · ${formatPlanPrice(p.amountPaise)}`}
                    subtitle={formatDate(p.paidAt ?? p.createdAt)}
                    value={p.status}
                  />
                ))}
              </ListSection>
              {payments.length > HISTORY_PREVIEW ? (
                <Button
                  label={showAllHistory ? "Show less" : `Show all ${payments.length}`}
                  variant="tertiary"
                  size="sm"
                  onPress={() => setShowAllHistory((v) => !v)}
                />
              ) : null}
            </View>
          ) : null}

          <Accordion title="Questions" items={FAQS} />
        </>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statusActive: { backgroundColor: colors.successSoft },
  statusTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  statusTitle: { ...type.heading, color: colors.ink, flex: 1 },
  statusText: { ...type.body, color: colors.inkSecondary },
  plan: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.lg,
    gap: spacing.xs,
    boxShadow: shadow.card,
  },
  planHighlighted: { borderColor: colors.accentBorder, borderWidth: 1.5 },
  planName: { ...type.heading, color: colors.ink, flex: 1 },
  planPrice: { ...type.title, color: colors.ink, fontVariant: ["tabular-nums"] },
  planPeriod: { ...type.body, color: colors.inkMuted },
  feature: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { ...type.body, color: colors.ink, flex: 1 },
});
