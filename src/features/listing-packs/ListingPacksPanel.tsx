import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Sparkles } from "@/components/ui/icons";
import { appAlert } from "@/components/ui/app-alert";
import {
  RazorpayCheckoutModal,
  type RazorpayCheckoutSuccess,
} from "@/components/ui/razorpay-checkout-modal";
import { isApiMode } from "@/lib/api/config";
import {
  apiCreateListingPackOrder,
  apiGetListingQuota,
  apiListListingPlans,
  apiVerifyListingPackPayment,
  type DealerListingQuota,
  type ListingPackOrder,
  type ListingPlan,
} from "@/lib/api/services/listing-plans";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export function ListingPacksPanel({ canBuy }: { canBuy: boolean }) {
  const [plans, setPlans] = useState<ListingPlan[]>([]);
  const [quota, setQuota] = useState<DealerListingQuota | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isApiMode);
  const [checkout, setCheckout] = useState<(ListingPackOrder & { plan: ListingPlan }) | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    const [nextPlans, nextQuota] = await Promise.all([
      apiListListingPlans(),
      apiGetListingQuota(),
    ]);
    setPlans(nextPlans);
    setQuota(nextQuota);
  };

  useEffect(() => {
    if (!isApiMode || !canBuy) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load listing packs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canBuy]);

  const buy = async (plan: ListingPlan) => {
    setBusyId(plan.id);
    try {
      const order = await apiCreateListingPackOrder(plan.id);
      if (!order.keyId) throw new Error("Razorpay is not configured on the server.");
      setCheckout({ ...order, plan });
    } catch (err) {
      appAlert("Checkout failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const onSuccess = async (response: RazorpayCheckoutSuccess) => {
    setCheckout(null);
    try {
      await apiVerifyListingPackPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      await refresh();
      appAlert("Payment verified", "Listing slots were added to your account.");
    } catch (err) {
      appAlert(
        "Verification issue",
        err instanceof Error ? err.message : "Payment received but slots are not confirmed yet.",
      );
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          backgroundColor: colors.accentSoft,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <Sparkles size={20} color={colors.accent} />
        <Text style={{ ...type.emphasis, color: colors.ink }}>Listing packs</Text>
        <Text style={{ ...type.body, color: colors.inkSecondary }}>
          Extra slots on top of your monthly cap. New packs added by admin show up here automatically.
        </Text>
      </View>

      {quota ? (
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          {quota.unlimited
            ? `Used ${quota.used} · unlimited included cap · ${quota.purchased} from packs`
            : `Slots used ${quota.used} of ${quota.quota} · ${quota.remaining} left · ${quota.purchased} from packs`}
        </Text>
      ) : null}

      {error ? <Text style={{ ...type.caption, color: colors.danger }}>{error}</Text> : null}

      {loading ? <Text style={{ ...type.body, color: colors.inkSecondary }}>Loading packs…</Text> : null}

      {canBuy && !loading && plans.length === 0 ? (
        <Text style={{ ...type.body, color: colors.inkSecondary }}>
          No listing packs are on sale yet. Ask admin to add one.
        </Text>
      ) : null}

      {canBuy && !loading
        ? plans.map((plan) => (
            <View
              key={plan.id}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.lg,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...type.heading, color: colors.ink }}>{plan.name}</Text>
                <Text style={{ ...type.emphasis, color: colors.accent }}>₹{plan.priceInr}</Text>
              </View>
              <Text style={{ ...type.body, color: colors.inkSecondary }}>
                {plan.description || `Add ${plan.slots} more property slots.`}
              </Text>
              <Pressable
                onPress={() => void buy(plan)}
                disabled={busyId === plan.id}
                style={{
                  marginTop: spacing.sm,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: busyId === plan.id ? 0.7 : 1,
                }}
              >
                <Text style={{ ...type.label, color: colors.onAccent }}>
                  {busyId === plan.id ? "Opening…" : `Pay ₹${plan.priceInr} · +${plan.slots}`}
                </Text>
              </Pressable>
            </View>
          ))
        : null}

      {checkout?.keyId ? (
        <RazorpayCheckoutModal
          visible
          keyId={checkout.keyId}
          orderId={checkout.razorpayOrderId}
          amount={checkout.amountPaise}
          currency={checkout.currency}
          description={`${checkout.plan.name} · +${checkout.plan.slots} listings`}
          onSuccess={(payload) => void onSuccess(payload)}
          onDismiss={() => setCheckout(null)}
          onError={(message) => {
            setCheckout(null);
            appAlert("Payment failed", message);
          }}
        />
      ) : null}
    </View>
  );
}
