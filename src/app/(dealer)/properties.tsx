import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, ChipGroup, ListSkeleton, Screen, StatusBadge, toast } from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { HeaderPillButton } from "@/components/ui/screen-navbar";
import { Building2, ClipboardList, Home, Pencil, Plus, Send, Trash2 } from "@/components/ui/icons";
import { useListings, usePlatform, useSession } from "@/hooks/domain";
import type { Property, PropertyStatus } from "@/data/types";
import { apiGetListingQuota } from "@/lib/api/services/listing-plans";
import { apiListMyProperties } from "@/lib/api/services/properties";
import { formatPriceWithPeriod } from "@/lib/format";
import { ownsProperty } from "@/lib/ownership";
import { PROPERTY_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, spacing, type } from "@/theme/tokens";

type Filter = PropertyStatus | "All";

const FILTERS: Filter[] = ["All", "Draft", "Pending Review", "Active", "Sold", "Rented", "Rejected"];

export default function DealerPropertiesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ status?: string }>();
  const { isApiMode } = usePlatform();
  const { userEmail, profile } = useSession();
  const { properties, deleteProperty, updateProperty, mergeProperties, getLastActionError } = useListings();

  const [filter, setFilter] = useState<Filter>(
    FILTERS.includes(params.status as Filter) ? (params.status as Filter) : "All",
  );

  const mineQuery = useQuery({
    queryKey: ["properties", "mine"],
    queryFn: () => apiListMyProperties(100),
    enabled: isApiMode,
  });
  const quotaQuery = useQuery({
    queryKey: ["dealer", "listing-quota"],
    queryFn: apiGetListingQuota,
    enabled: isApiMode,
  });

  useEffect(() => {
    if (mineQuery.data) mergeProperties(mineQuery.data);
  }, [mineQuery.data, mergeProperties]);

  const mine = useMemo(
    () => mineQuery.data ?? properties.filter((p) => ownsProperty(p, { userId: profile?.id, email: userEmail })),
    [mineQuery.data, properties, profile?.id, userEmail],
  );
  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["All", mine.length]]);
    for (const p of mine) map.set(p.status, (map.get(p.status) ?? 0) + 1);
    return map;
  }, [mine]);
  const filtered = useMemo(() => (filter === "All" ? mine : mine.filter((p) => p.status === filter)), [mine, filter]);

  const quota = quotaQuery.data;
  const atCap = Boolean(quota?.atCap && !quota.unlimited);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
    void queryClient.invalidateQueries({ queryKey: ["dealer", "listing-quota"] });
  };

  const handleDelete = (item: Property) => {
    appAlert("Delete listing?", `"${item.title}" will be removed for good.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteProperty(item.id);
          if (!ok) {
            appAlert("Couldn't delete", getLastActionError() ?? "Please try again.");
            return;
          }
          refresh();
          toast("Listing deleted");
        },
      },
    ]);
  };

  const handleSubmit = async (item: Property) => {
    const updated = await updateProperty(item.id, { status: "Pending Review" });
    if (!updated) {
      appAlert("Couldn't submit", getLastActionError() ?? "Open the listing and check the required fields.");
      return;
    }
    refresh();
    toast("Sent for review");
  };

  const header = (
    <View style={styles.header}>
      {quota && !quota.unlimited ? (
        <View style={[styles.quota, atCap && styles.quotaWarn]}>
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <Text style={styles.quotaTitle}>
              {atCap ? "No listing slots left" : `${quota.remaining} of ${quota.quota} listing slots left`}
            </Text>
            <Text style={styles.meta}>
              {quota.free} free{quota.purchased ? ` + ${quota.purchased} from packs` : ""} · {quota.used} used
            </Text>
          </View>
          {atCap ? (
            <Button label="Get more" variant="secondary" onPress={() => router.push("/subscription" as Href)} />
          ) : null}
        </View>
      ) : null}
      <ChipGroup
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        labelFor={(f) => {
          const label = f === "All" ? "All" : (PROPERTY_STATUS_LABEL[f] ?? f);
          const n = counts.get(f);
          return n ? `${label} (${n})` : label;
        }}
      />
    </View>
  );

  return (
    <Screen
      title="Listings"
      subtitle={`${mine.length} listing${mine.length === 1 ? "" : "s"}`}
      root
      scroll={false}
      rightAction={
        <HeaderPillButton icon={Building2} label="Projects" onPress={() => router.push("/dealer-projects" as Href)} />
      }
      actions={
        atCap
          ? undefined
          : [{ icon: Plus, label: "Add property", tone: "accent", onPress: () => router.push("/post-property" as Href) }]
      }
    >
      <FlatList
        data={isApiMode && mineQuery.isPending ? [] : filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={mineQuery.isRefetching}
        onRefresh={isApiMode ? refresh : undefined}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isApiMode && mineQuery.isPending ? (
            <ListSkeleton rows={3} />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={filter === "All" ? "No listings yet" : `No ${(PROPERTY_STATUS_LABEL[filter as PropertyStatus] ?? filter).toLowerCase()} listings`}
              message={filter === "Draft" ? "Drafts you save from Add property show up here." : "Add a property to start getting buyer inquiries."}
              actionLabel={atCap ? undefined : "Add property"}
              onAction={atCap ? undefined : () => router.push("/post-property" as Href)}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push(
                item.status === "Active"
                  ? { pathname: "/property/[id]", params: { id: item.id } }
                  : { pathname: "/edit-property/[id]", params: { id: item.id } },
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.status}`}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.row}>
              <View style={styles.thumb}>
                {item.images[0] ? (
                  <Image source={{ uri: item.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Home size={22} color={colors.inkMuted} />
                )}
              </View>
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.locality}, {item.city}
                </Text>
                <Text style={styles.price}>{formatPriceWithPeriod(item.price, item.purpose)}</Text>
              </View>
              <StatusBadge label={PROPERTY_STATUS_LABEL[item.status] ?? item.status} />
            </View>
            {item.status === "Rejected" && item.rejectionReason ? (
              <Text style={styles.reject} numberOfLines={3}>
                {item.rejectionReason}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Button
                label="Edit"
                icon={Pencil}
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: "/edit-property/[id]", params: { id: item.id } })}
              />
              {item.status === "Draft" ? (
                <Button label="Submit" icon={Send} style={{ flex: 1 }} onPress={() => void handleSubmit(item)} />
              ) : null}
              <Pressable
                onPress={() => handleDelete(item)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.title}`}
                style={styles.delete}
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.xs },
  quota: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
  },
  quotaWarn: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningBorder },
  quotaTitle: { ...type.emphasis, color: colors.ink },
  card: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  title: { ...type.emphasis, color: colors.ink },
  meta: { ...type.caption, color: colors.inkMuted },
  price: { ...type.label, color: colors.accent },
  reject: { ...type.caption, color: colors.danger },
  actions: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  delete: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dangerSoft,
  },
});
