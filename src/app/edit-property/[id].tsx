import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EmptyState, ErrorState, ListSkeleton, Screen, StatusBadge, toast } from "@/components/ds";
import { ListingForm, type ListingPayload, type ListingSaveStatus } from "@/components/listing/ListingForm";
import { draftFromProperty } from "@/components/listing/listing-draft";
import { appAlert } from "@/components/ui/app-alert";
import { Lock } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/lib/api/client";
import { apiGetProperty } from "@/lib/api/services/properties";
import { ownsProperty } from "@/lib/ownership";
import { colors, radius, spacing, type } from "@/theme/tokens";

const STATUS_NOTE: Partial<Record<string, string>> = {
  "Pending Review": "Our team is reviewing this listing. You can still make changes.",
  Active: "This listing is live. Changes are visible to buyers right away.",
  Sold: "This listing is marked sold.",
  Rented: "This listing is marked rented.",
  Draft: "Drafts stay private until you submit them for review.",
};

export default function EditPropertyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isApiMode, properties, updateProperty, getLastActionError, profile, userEmail, mergeProperties } =
    useApp();

  const local = useMemo(() => properties.find((p) => p.id === id), [properties, id]);
  const remote = useQuery({
    queryKey: ["property", id],
    queryFn: () => apiGetProperty(id),
    enabled: isApiMode && Boolean(id),
  });
  useEffect(() => {
    if (remote.data) mergeProperties([remote.data]);
  }, [remote.data, mergeProperties]);

  const property = local ?? remote.data;

  if (!property) {
    if (remote.isLoading) {
      return (
        <Screen title="Edit listing" fallbackHref="/my-listings">
          <ListSkeleton rows={6} />
        </Screen>
      );
    }
    const notFound = !isApiMode || (remote.error instanceof ApiError && remote.error.status === 404);
    return (
      <Screen title="Edit listing" fallbackHref="/my-listings">
        <ErrorState
          title={notFound ? "Listing not found" : "Couldn't load listing"}
          message={notFound ? "It may have been removed." : undefined}
          onRetry={notFound ? undefined : () => void remote.refetch()}
        />
      </Screen>
    );
  }

  if (!ownsProperty(property, { userId: profile?.id, email: userEmail })) {
    return (
      <Screen title="Edit listing" fallbackHref="/my-listings">
        <EmptyState
          icon={Lock}
          title="You can't edit this listing"
          message="Only the owner or listing dealer can make changes."
          actionLabel="My listings"
          onAction={() => router.replace("/my-listings")}
        />
      </Screen>
    );
  }

  const onSave = async (payload: ListingPayload, status: ListingSaveStatus) => {
    const updated = await updateProperty(property.id, status ? { ...payload, status } : payload);
    if (!updated) {
      appAlert("Couldn't save changes", getLastActionError() ?? "Please try again.");
      return false;
    }
    void queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
    void queryClient.invalidateQueries({ queryKey: ["property", property.id] });
    toast(status === "Pending Review" ? "Submitted for review" : "Changes saved", "success");
    if (router.canGoBack()) router.back();
    else router.replace("/my-listings");
    return true;
  };

  const rejected = property.status === "Rejected";
  const banner = (
    <View style={[styles.banner, rejected && styles.bannerWarn]}>
      <StatusBadge label={property.status} />
      <Text style={styles.bannerText}>
        {rejected
          ? property.rejectionReason
            ? `Not approved: ${property.rejectionReason}. Fix the details and resubmit.`
            : "Not approved. Update the details and resubmit for review."
          : STATUS_NOTE[property.status]}
      </Text>
    </View>
  );

  return (
    <ListingForm
      key={property.id}
      mode="edit"
      screenTitle="Edit listing"
      initial={draftFromProperty(property)}
      status={property.status}
      banner={banner}
      onSave={onSave}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "flex-start",
  },
  bannerWarn: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningBorder },
  bannerText: { ...type.body, color: colors.inkSecondary },
});
