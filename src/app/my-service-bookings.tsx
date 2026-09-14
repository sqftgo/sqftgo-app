import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Briefcase } from "@/components/ui/icons";

import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { isApiMode } from "@/lib/api/config";
import {
  apiCancelServiceBooking,
  apiListMyServiceBookings,
  type ServiceBooking,
} from "@/lib/api/services/services";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(255, 184, 0, 0.12)", color: "#B45309" },
  confirmed: { bg: colors.successSoft, color: colors.success },
  cancelled: { bg: colors.surfaceSubtle, color: colors.inkMuted },
  completed: { bg: colors.infoSoft, color: colors.info },
};

export default function MyServiceBookingsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isApiMode) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await apiListMyServiceBookings());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = (item: ServiceBooking) => {
    if (item.status === "cancelled" || item.status === "completed") return;
    appAlert("Cancel booking", "Cancel this service request?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel booking",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await apiCancelServiceBooking(item.id);
            setItems((prev) => prev.map((b) => (b.id === item.id ? updated : b)));
          } catch (e) {
            appAlert("Could not cancel", e instanceof Error ? e.message : "Try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
        </Pressable>
        <Text style={{ ...type.title, color: colors.ink }}>My service bookings</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Requests you sent to service partners
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={Briefcase}
            title={isApiMode ? "No bookings yet" : "API mode required"}
            message={
              isApiMode
                ? "Book a partner from Services."
                : "Set EXPO_PUBLIC_API_URL to sync bookings."
            }
            actionLabel="Browse services"
            onAction={() => router.push("/(tabs)/services" as Href)}
          />
        }
        renderItem={({ item }) => {
          const tone = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
          return (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...type.emphasis, color: colors.ink, flex: 1 }}>
                  {item.firmName || "Service partner"}
                </Text>
                <View style={{ backgroundColor: tone.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                  <Text style={{ ...type.micro, fontWeight: "700", color: tone.color }}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {item.city ? `${item.city} · ` : ""}
                {new Date(item.preferredAt).toLocaleString()}
              </Text>
              {item.message ? (
                <Text style={{ ...type.body, color: colors.inkSecondary }} numberOfLines={3}>
                  {item.message}
                </Text>
              ) : null}
              {item.status === "pending" || item.status === "confirmed" ? (
                <Pressable onPress={() => cancel(item)}>
                  <Text style={{ ...type.label, color: colors.danger }}>Cancel booking</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
