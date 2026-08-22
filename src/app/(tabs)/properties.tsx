import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { appAlert } from "@/components/ui/app-alert";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ClipboardList,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { Property, PropertyStatus } from "@/data/types";
import { formatPriceWithPeriod } from "@/lib/format";
import { ownsProperty } from "@/lib/ownership";
import { PROPERTY_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const FILTERS: (PropertyStatus | "All")[] = [
  "All",
  "Draft",
  "Pending Review",
  "Active",
  "Sold",
  "Rented",
  "Rejected",
];

const STATUS_TONE: Record<PropertyStatus, { bg: string; color: string }> = {
  Draft: { bg: colors.surfaceSubtle, color: colors.inkMuted },
  "Pending Review": { bg: "rgba(255, 184, 0, 0.12)", color: "#B45309" },
  Active: { bg: colors.successSoft, color: colors.success },
  Sold: { bg: colors.infoSoft, color: colors.info },
  Rented: { bg: colors.infoSoft, color: colors.info },
  Rejected: { bg: colors.dangerSoft, color: colors.danger },
};

export default function MyPropertiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const {
    properties,
    userEmail,
    profile,
    canAccessDealerDashboard,
    dealerAccess,
    deleteProperty,
    updateProperty,
  } = useApp();

  const initialFilter =
    params.status && FILTERS.includes(params.status as PropertyStatus)
      ? (params.status as PropertyStatus)
      : "All";
  const [filter, setFilter] = useState<PropertyStatus | "All">(initialFilter);

  const mine = useMemo(
    () =>
      properties.filter((p) =>
        ownsProperty(p, { userId: profile?.id, email: userEmail }),
      ),
    [properties, profile?.id, userEmail],
  );

  const filtered = useMemo(
    () => (filter === "All" ? mine : mine.filter((p) => p.status === filter)),
    [mine, filter],
  );

  if (!canAccessDealerDashboard) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={ClipboardList}
          title="Pending dealer access"
          message={
            dealerAccess === "pending"
              ? "Your directory is submitted. Full dashboard unlocks after web admin sets role to broker."
              : "Register your dealer directory first."
          }
          actionLabel={dealerAccess === "pending" ? "View status" : "Become a dealer"}
          onAction={() =>
            router.push(
              (dealerAccess === "pending" ? "/dealer-pending" : "/dealer-register") as Href,
            )
          }
        />
      </SafeAreaView>
    );
  }

  const handleDelete = (item: Property) => {
    appAlert("Delete listing", `Remove “${item.title}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteProperty(item.id);
          if (!ok) appAlert("Could not delete", "Try again or check ownership.");
        },
      },
    ]);
  };

  const handleSubmit = async (item: Property) => {
    if (item.status !== "Draft") return;
    const updated = await updateProperty(item.id, { status: "Pending Review" });
    if (!updated) {
      appAlert("Could not submit", "Brokers cannot self-activate listings.");
      return;
    }
    appAlert("Submitted", "Listing is now Pending Review for web admin approval.");
  };

  const renderItem = ({ item }: { item: Property }) => {
    const tone = STATUS_TONE[item.status];
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          boxShadow: shadow.card,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.emphasis, color: colors.ink }} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 4 }}>
              {item.locality}, {item.city} · {formatPriceWithPeriod(item.price, item.purpose)}
            </Text>
          </View>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: tone.bg,
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
              borderRadius: radius.full,
            }}
          >
            <Text style={{ ...type.micro, color: tone.color, fontWeight: "700" }}>
              {PROPERTY_STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
          <Pressable
            onPress={() => router.push(`/edit-property/${item.id}` as Href)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceSubtle,
            }}
          >
            <Pencil size={14} color={colors.ink} />
            <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>Edit</Text>
          </Pressable>
          {item.status === "Draft" ? (
            <Pressable
              onPress={() => void handleSubmit(item)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Send size={14} color={colors.accent} />
              <Text style={{ ...type.caption, color: colors.accent, fontWeight: "700" }}>
                Submit
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => handleDelete(item)}
            style={{
              width: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.md,
              backgroundColor: colors.dangerSoft,
            }}
          >
            <Trash2 size={16} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ ...type.title, color: colors.ink }}>My Properties</Text>
          <Text style={{ ...type.caption, color: colors.inkMuted }}>
            {mine.length} listing{mine.length === 1 ? "" : "s"}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/post-property" as Href)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.accent,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.full,
            boxShadow: shadow.accent,
          }}
        >
          <Plus size={16} color={colors.onAccent} />
          <Text style={{ ...type.caption, color: colors.onAccent, fontWeight: "700" }}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          gap: spacing.sm,
          paddingBottom: spacing.md,
        }}
        renderItem={({ item }) => {
          const active = filter === item;
          return (
            <Pressable
              onPress={() => setFilter(item)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: active ? colors.ink : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.ink : colors.border,
              }}
            >
              <Text
                style={{
                  ...type.caption,
                  fontWeight: "700",
                  color: active ? colors.onAccent : colors.inkSecondary,
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
        style={{ flexGrow: 0 }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
          flexGrow: 1,
        }}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon={ClipboardList}
            title="No listings here"
            message={
              filter === "Draft"
                ? "No drafts yet. Save a listing as Draft from Add Property."
                : "Add a property to get started."
            }
            actionLabel="Add property"
            onAction={() => router.push("/post-property" as Href)}
          />
        }
      />
    </SafeAreaView>
  );
}
