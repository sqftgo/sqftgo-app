import React, { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Sparkles } from "@/components/ui/icons";
import { API_BASE_URL, isApiMode } from "@/lib/api/config";
import {
  apiGetListingQuota,
  apiListListingPlans,
  type DealerListingQuota,
  type ListingPlan,
} from "@/lib/api/services/listing-plans";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

function packsUrl() {
  const path = "/dealer/dashboard/subscription";
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

export function ListingPacksPanel({ canBuy }: { canBuy: boolean }) {
  const [plans, setPlans] = useState<ListingPlan[]>([]);
  const [quota, setQuota] = useState<DealerListingQuota | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isApiMode);

  useEffect(() => {
    if (!isApiMode || !canBuy) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [nextPlans, nextQuota] = await Promise.all([
          apiListListingPlans(),
          apiGetListingQuota(),
        ]);
        if (!cancelled) {
          setPlans(nextPlans);
          setQuota(nextQuota);
        }
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

  const openWebCheckout = () => {
    void Linking.openURL(packsUrl());
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
          3 free listings, then buy extra slots. New packs added by admin show up here automatically.
          Checkout runs on the SqftGo website with Razorpay.
        </Text>
      </View>

      {quota ? (
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Slots used {quota.used} of {quota.quota} · {quota.remaining} left · {quota.purchased} bought
          or granted
        </Text>
      ) : null}

      {error ? <Text style={{ ...type.caption, color: colors.danger }}>{error}</Text> : null}

      {!canBuy ? (
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Full dealer tools still require broker role approval.
        </Text>
      ) : null}

      {loading ? <Text style={{ ...type.body, color: colors.inkSecondary }}>Loading packs…</Text> : null}

      {canBuy && !loading && plans.length === 0 ? (
        <Text style={{ ...type.body, color: colors.inkSecondary }}>
          No listing packs are on sale yet. Ask admin to add one — it will appear here without an app update.
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
              <Text style={{ ...type.caption, color: colors.inkMuted }}>+{plan.slots} listings</Text>
              <Pressable
                onPress={openWebCheckout}
                style={{
                  marginTop: spacing.sm,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...type.label, color: colors.onAccent }}>Pay on website</Text>
              </Pressable>
            </View>
          ))
        : null}

      {!isApiMode && canBuy ? (
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Connect the live API to load listing packs from admin.
        </Text>
      ) : null}
    </View>
  );
}
