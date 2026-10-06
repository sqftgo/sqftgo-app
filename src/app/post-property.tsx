import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, EmptyState, Screen, toast } from "@/components/ds";
import { ListingForm, type ListingPayload, type ListingSaveStatus } from "@/components/listing/ListingForm";
import { emptyDraft } from "@/components/listing/listing-draft";
import { appAlert } from "@/components/ui/app-alert";
import { Lock } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { apiGetListingQuota } from "@/lib/api/services/listing-plans";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function PostPropertyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    isApiMode,
    isLoggedIn,
    addProperty,
    getLastActionError,
    selectedCity,
    canAccessDealerDashboard,
    profile,
    userRole,
    platformSettings,
    myListingsCount,
  } = useApp();

  const isDealer = canAccessDealerDashboard;
  const quotaQuery = useQuery({
    queryKey: ["dealer", "listing-quota"],
    queryFn: apiGetListingQuota,
    enabled: isApiMode && isDealer,
  });
  const quota = quotaQuery.data;

  const initial = useMemo(
    () => emptyDraft(selectedCity === "All India" ? "" : selectedCity),
    [selectedCity],
  );

  const blockedReason = (() => {
    if (!isLoggedIn) return null;
    if (profile?.status !== "active") return "Your account is not active, so you can't add listings.";
    if (isDealer) return null;
    if (userRole !== "user") return "Only owners and approved dealers can list property.";
    if (profile?.listingStatus === "rejected") return "Your listing access was declined. Contact support for help.";
    if (!platformSettings.allowUserListings) return "New owner listings are paused right now.";
    if (myListingsCount >= platformSettings.maxListingsPerUser) {
      return `You've used all ${platformSettings.maxListingsPerUser} listing slots. Remove a listing to add another.`;
    }
    return null;
  })();

  if (!isLoggedIn) {
    return (
      <Screen title="List a property">
        <EmptyState
          icon={Lock}
          title="Sign in to list"
          message="Create a free account to list your property and get enquiries from buyers."
          actionLabel="Sign in"
          onAction={() => router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)}
        />
      </Screen>
    );
  }

  if (blockedReason) {
    return (
      <Screen title="List a property">
        <EmptyState
          icon={Lock}
          title="Can't add a listing"
          message={blockedReason}
          actionLabel="My listings"
          onAction={() => router.replace("/my-listings")}
        />
      </Screen>
    );
  }

  const dealerAtCap = Boolean(quota?.atCap && !quota.unlimited);

  const banner = isDealer ? (
    quota && !quota.unlimited ? (
      <View style={[styles.banner, dealerAtCap && styles.bannerWarn]}>
        <Text style={styles.bannerTitle}>
          {dealerAtCap ? "No listing slots left" : `${quota.remaining} of ${quota.quota} listing slots left`}
        </Text>
        {dealerAtCap ? (
          <>
            <Text style={styles.bannerText}>Buy a listing pack to add more properties.</Text>
            <Button label="View listing packs" variant="secondary" onPress={() => router.push("/subscription")} />
          </>
        ) : null}
      </View>
    ) : null
  ) : (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>
        {platformSettings.maxListingsPerUser - myListingsCount} of {platformSettings.maxListingsPerUser} listing
        slots left
      </Text>
      <Text style={styles.bannerText}>Rejected listings don&apos;t count toward your limit.</Text>
    </View>
  );

  const onSave = async (payload: ListingPayload, status: ListingSaveStatus) => {
    const created = await addProperty({ ...payload, status: status ?? "Pending Review" });
    if (!created) {
      appAlert("Couldn't save listing", getLastActionError() ?? "Please try again.");
      return false;
    }
    void queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
    void queryClient.invalidateQueries({ queryKey: ["dealer", "listing-quota"] });
    toast(status === "Draft" ? "Draft saved" : "Submitted for review", "success");
    router.replace(isDealer ? "/(dealer)/properties" : "/my-listings");
    return true;
  };

  return (
    <ListingForm
      mode="create"
      screenTitle="List a property"
      initial={initial}
      banner={banner}
      blocked={dealerAtCap}
      onSave={onSave}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.infoSoft,
  },
  bannerWarn: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningBorder },
  bannerTitle: { ...type.emphasis, color: colors.ink },
  bannerText: { ...type.caption, color: colors.inkSecondary },
});
